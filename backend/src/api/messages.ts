import express, { type Request, type Response } from "express";
import prisma from "../db";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

const router = express.Router();

router.get("/", async function (_req: Request, res: Response) {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    return res.status(200).json({ messages });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/:id", async function (req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const message = await prisma.message.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    if (!message) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ message });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { text } = (req.body ?? {}) as { text?: string };
    if (!text || typeof text !== "string") return res.status(400).json({ error: "Text required" });

    const message = await prisma.message.create({
      data: { text, authorId: userId },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    return res.status(201).json({ message });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.put("/:id", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const { text } = (req.body ?? {}) as { text?: string };

    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    const message = await prisma.message.update({
      where: { id },
      data: { ...(text !== undefined ? { text } : {}) },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    return res.status(200).json({ message });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    await prisma.message.delete({ where: { id } });
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;

