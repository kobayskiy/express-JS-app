import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { config } from "../config";

export type JwtPayload = {
  userId: number;
  role: "USER" | "AGENT" | "ADMIN";
};

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.jwtSecret as Secret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

