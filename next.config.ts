import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both of these are stable in Next 16; the `as any` that used to sit here
  // dated from when reactCompiler was still under `experimental`.
  reactCompiler: true,
  serverExternalPackages: [
    "@tailwindcss/oxide",
    "@tailwindcss/postcss",
    "better-sqlite3",
    "@prisma/client",
  ],
  // The SQLite file is opened by a computed path, so tracing can't see it.
  // Ship it with every server route: on Vercel it is copied to /tmp at
  // startup (see src/data/db.ts), carrying the demo cases seeded at build.
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
  allowedDevOrigins: ["192.168.1.97", "localhost", "127.0.0.1"],
};

export default nextConfig;
