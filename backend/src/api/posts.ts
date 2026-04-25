import express, { type Request, type Response } from "express";
import { requireAuth, requireRoles, type AuthedRequest } from "../middleware/auth";
import {
  createPost,
  deletePost,
  getPostById,
  listPosts,
  updatePost,
} from "../services/posts.service";

const router = express.Router();

router.use(requireAuth);

router.get("/", async function (req: AuthedRequest, res: Response) {
  try {
    const posts = await listPosts(req.user!.id);
    return res.status(200).json({ posts });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.get("/:id", async function (req: AuthedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const post = await getPostById(req.user!.id, id);
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ post });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.post("/", requireRoles(["USER"]), async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { title, content } = (req.body ?? {}) as { title?: string; content?: string };
    if (!title || typeof title !== "string") return res.status(400).json({ error: "Title required" });

    const post = await createPost(userId, { title, content: content ?? null });
    return res.status(201).json({ post });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.put("/:id", async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const { title, content } = (req.body ?? {}) as { title?: string; content?: string | null };

    const result = await updatePost(userId, id, { title, content: content ?? null });
    if ("error" in result) {
      if (result.error === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
      if (result.error === "FORBIDDEN") return res.status(403).json({ error: "Forbidden" });
    }
    return res.status(200).json({ post: result.post });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/:id", async function (req: AuthedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const result = await deletePost(userId, id);
    if ("error" in result) {
      if (result.error === "NOT_FOUND") return res.status(404).json({ error: "Not found" });
      if (result.error === "FORBIDDEN") return res.status(403).json({ error: "Forbidden" });
    }
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;

