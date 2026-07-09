import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: [
    "@tailwindcss/oxide",
    "@tailwindcss/postcss",
    "better-sqlite3",
    "@prisma/client"
  ],
  allowedDevOrigins: ["192.168.1.97", "localhost", "127.0.0.1"]
} as any;

export default nextConfig;
