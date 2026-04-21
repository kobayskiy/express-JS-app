"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import { pool } from "./db";
const auth_1 = __importDefault(require("./api/auth"));
const posts_1 = __importDefault(require("./api/posts"));
const messages_1 = __importDefault(require("./api/messages"));
const config_1 = require("./config");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowed = origin === config_1.config.clientOrigin ||
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
        return callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
}));
app.use("/api/auth", auth_1.default);
app.use("/api/posts", posts_1.default);
app.use("/api/messages", messages_1.default);
app.get("/", (req, res) => {
    res.status(200).json({ status: "ok!!!!!!" });
});
app.listen(config_1.config.port, () => {
    console.log(`Server running on http://localhost:${config_1.config.port}`);
});
