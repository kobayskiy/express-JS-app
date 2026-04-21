"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hashPass_1 = require("../utils/hashPass");
const db_1 = __importDefault(require("../db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/login", async function (req, res) {
    try {
        const { email, password } = (req.body ?? {});
        if (!email || !password)
            return res.status(400).json({ error: "Email or password required" });
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });
        const ok = await bcrypt_1.default.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ error: "Invalid credentials" });
        const token = (0, jwt_1.signToken)({ userId: user.id });
        return res.status(200).json({
            token,
            user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
        });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.get("/me", auth_1.requireAuth, async function (req, res) {
    try {
        const userId = req.user.id;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true, createdAt: true },
        });
        if (!user)
            return res.status(404).json({ error: "Not found" });
        return res.status(200).json({ user });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
router.post("/register", async function (req, res) {
    try {
        const { username, email, password } = req.body;
        if (!email || !password || !username)
            return res.status(400).json({ error: "Username, email and password required" });
        const existing = await db_1.default.user.findFirst({
            where: { OR: [{ email }, { username }] },
            select: { id: true },
        });
        if (existing)
            return res.status(409).json({ error: "User already exists" });
        const hashedPass = await (0, hashPass_1.hashPass)(password);
        const newUser = await db_1.default.user.create({
            data: { username, email, password: hashedPass },
            select: { id: true, username: true, email: true, createdAt: true },
        });
        const token = (0, jwt_1.signToken)({ userId: newUser.id });
        return res.status(201).json({ token, user: newUser });
    }
    catch {
        return res.status(500).json({ error: "Internal error" });
    }
});
exports.default = router;
