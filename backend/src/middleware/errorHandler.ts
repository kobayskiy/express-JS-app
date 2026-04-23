import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Keep output stable and simple for the frontend
  const message = err instanceof Error ? err.message : "Internal error";
  return res.status(500).json({ error: message || "Internal error" });
}

