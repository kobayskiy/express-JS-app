import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthedRequest = Request & {
  user?: { id: number };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

