import express, { type Request, type Response } from "express";
import cors from "cors";
// import { pool } from "./db";

import authRouter from "./api/auth";
import postsRouter from "./api/posts";
import messagesRouter from "./api/messages";
import { config } from "./config";

const app = express();

app.use(express.json());
app.use(cors({ origin: config.clientOrigin, credentials: true }));

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/messages", messagesRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok!!!!!!" });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
