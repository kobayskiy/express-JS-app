"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    // Keep output stable and simple for the frontend
    const message = err instanceof Error ? err.message : "Internal error";
    return res.status(500).json({ error: message || "Internal error" });
}
