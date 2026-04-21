import express, { Request, Response } from "express";
import { hashPass } from "../utils/hashPass";
import prisma from "../db";
import bcrypt from "bcrypt";
import { signToken } from "../utils/jwt";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

interface RegisterBody {
  username?: string;
  email?: string;
  password?: string;
}

const router = express.Router();

router.post("/login", async function (req: Request, res: Response) {
  try {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: "Email or password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ userId: user.id });
    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/me", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post(
  "/register",
  async function (req: Request<{}, {}, RegisterBody>, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!email || !password || !username)
        return res.status(400).json({ error: "Username, email and password required" });

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
        select: { id: true },
      });
      if (existing) return res.status(409).json({ error: "User already exists" });

      const hashedPass = await hashPass(password);
      const newUser = await prisma.user.create({
        data: { username, email, password: hashedPass },
        select: { id: true, username: true, email: true, createdAt: true },
      });
      const token = signToken({ userId: newUser.id });
      return res.status(201).json({ token, user: newUser });
    } catch {
      return res.status(500).json({ error: "Internal error" });
    }
  },
);

export default router;
