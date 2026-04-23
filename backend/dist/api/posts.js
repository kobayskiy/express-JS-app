"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const posts_service_1 = require("../services/posts.service");
const router = express_1.default.Router();
router.use(auth_1.requireAuth);
router.get("/", async function (req, res) {
    try {
        const posts = await (0, posts_service_1.listPosts)(req.user.id);
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
        const post = await (0, posts_service_1.getPostById)(req.user.id, id);
        if (!post)
            return res.status(404).json({ error: "Not found" });
        return res.status(200).json({ post });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.post("/", async function (req, res) {
    try {
        const userId = req.user.id;
        const { title, content } = (req.body ?? {});
        if (!title || typeof title !== "string")
            return res.status(400).json({ error: "Title required" });
        const post = await (0, posts_service_1.createPost)(userId, { title, content: content ?? null });
        return res.status(201).json({ post });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.put("/:id", async function (req, res) {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "Invalid id" });
        const { title, content } = (req.body ?? {});
        const result = await (0, posts_service_1.updatePost)(userId, id, { title, content: content ?? null });
        if ("error" in result) {
            if (result.error === "NOT_FOUND")
                return res.status(404).json({ error: "Not found" });
            if (result.error === "FORBIDDEN")
                return res.status(403).json({ error: "Forbidden" });
        }
        return res.status(200).json({ post: result.post });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.delete("/:id", async function (req, res) {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            return res.status(400).json({ error: "Invalid id" });
        const result = await (0, posts_service_1.deletePost)(userId, id);
        if ("error" in result) {
            if (result.error === "NOT_FOUND")
                return res.status(404).json({ error: "Not found" });
            if (result.error === "FORBIDDEN")
                return res.status(403).json({ error: "Forbidden" });
        }
        return res.status(204).send();
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
exports.default = router;
