"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPosts = listPosts;
exports.getPostById = getPostById;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
const db_1 = __importDefault(require("../db"));
async function listPosts(userId) {
    // Access control: only authenticated users can interact with posts
    void userId;
    return db_1.default.post.findMany({
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, username: true, email: true } } },
    });
}
async function getPostById(userId, id) {
    void userId;
    return db_1.default.post.findUnique({
        where: { id },
        include: { author: { select: { id: true, username: true, email: true } } },
    });
}
async function createPost(userId, input) {
    return db_1.default.post.create({
        data: { title: input.title, content: input.content ?? null, authorId: userId },
        include: { author: { select: { id: true, username: true, email: true } } },
    });
}
async function updatePost(userId, id, input) {
    const existing = await db_1.default.post.findUnique({ where: { id } });
    if (!existing)
        return { error: "NOT_FOUND" };
    if (existing.authorId !== userId)
        return { error: "FORBIDDEN" };
    const post = await db_1.default.post.update({
        where: { id },
        data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.content !== undefined ? { content: input.content ?? null } : {}),
        },
        include: { author: { select: { id: true, username: true, email: true } } },
    });
    return { post };
}
async function deletePost(userId, id) {
    const existing = await db_1.default.post.findUnique({ where: { id } });
    if (!existing)
        return { error: "NOT_FOUND" };
    if (existing.authorId !== userId)
        return { error: "FORBIDDEN" };
    await db_1.default.post.delete({ where: { id } });
    return { ok: true };
}
