"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/", async function (_req, res) {
    try {
        const posts = await db_1.default.post.findMany({
            orderBy: { createdAt: "desc" },
            include: { author: { select: { id: true, username: true, email: true } } },
        });
        return res.status(200).json({ posts });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.get("/:id", async function (req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "Invalid id" });
        const post = await db_1.default.post.findUnique({
            where: { id },
            include: { author: { select: { id: true, username: true, email: true } } },
        });
        if (!post)
            return res.status(404).json({ error: "Not found" });
        return res.status(200).json({ post });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.post("/", auth_1.requireAuth, async function (req, res) {
    try {
        const userId = req.user.id;
        const { title, content } = (req.body ?? {});
        if (!title || typeof title !== "string")
            return res.status(400).json({ error: "Title required" });
        const post = await db_1.default.post.create({
            data: { title, content: content ?? null, authorId: userId },
            include: { author: { select: { id: true, username: true, email: true } } },
        });
        return res.status(201).json({ post });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.put("/:id", auth_1.requireAuth, async function (req, res) {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "Invalid id" });
        const { title, content } = (req.body ?? {});
        const existing = await db_1.default.post.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Not found" });
        if (existing.authorId !== userId)
            return res.status(403).json({ error: "Forbidden" });
        const post = await db_1.default.post.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title } : {}),
                ...(content !== undefined ? { content: content ?? null } : {}),
            },
            include: { author: { select: { id: true, username: true, email: true } } },
        });
        return res.status(200).json({ post });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.delete("/:id", auth_1.requireAuth, async function (req, res) {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "Invalid id" });
        const existing = await db_1.default.post.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: "Not found" });
        if (existing.authorId !== userId)
            return res.status(403).json({ error: "Forbidden" });
        await db_1.default.post.delete({ where: { id } });
        return res.status(204).send();
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
exports.default = router;
