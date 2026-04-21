import express, { type Request, type Response } from "express";
import prisma from "../db";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

const router = express.Router();

router.get("/", async function (_req: Request, res: Response) {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    return res.status(200).json({ posts });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/:id", async function (req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ post });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { title, content } = (req.body ?? {}) as { title?: string; content?: string };
    if (!title || typeof title !== "string") return res.status(400).json({ error: "Title required" });

    const post = await prisma.post.create({
      data: { title, content: content ?? null, authorId: userId },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    return res.status(201).json({ post });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.put("/:id", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const { title, content } = (req.body ?? {}) as { title?: string; content?: string | null };

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content: content ?? null } : {}),
      },
      include: { author: { select: { id: true, username: true, email: true } } },
    });
    return res.status(200).json({ post });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", requireAuth, async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.authorId !== userId) return res.status(403).json({ error: "Forbidden" });

    await prisma.post.delete({ where: { id } });
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;

