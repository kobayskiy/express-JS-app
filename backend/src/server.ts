import express, { type Request, type Response } from "express";
import cors from "cors";
// import { pool } from "./db";

import authRouter from "./api/auth";
import postsRouter from "./api/posts";
import messagesRouter from "./api/messages";
import { config } from "./config";
import { requestLogger } from "./middleware/requestLogger";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const allowed =
        origin === config.clientOrigin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      return callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/messages", messagesRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok!!!!!!" });
});

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
