import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};

