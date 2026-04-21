"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../utils/jwt");
function requireAuth(req, res, next) {
    const header = req.header("authorization") ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.userId };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
