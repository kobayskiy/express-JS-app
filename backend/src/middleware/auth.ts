import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthedRequest = Request & {
  user?: { id: number; role: "USER" | "AGENT" | "ADMIN" };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, role: payload.role ?? "USER" };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRoles(roles: Array<"USER" | "AGENT" | "ADMIN">) {
  return function (req: AuthedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

