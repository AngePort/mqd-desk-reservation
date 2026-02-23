import type { NextConfig } from "next";

function parseAllowedDevOrigins(value: string | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

// When running `next dev` on a VM and accessing it from another machine, Next can
// warn (and future versions will block) cross-origin requests to /_next/* assets.
// Configure allowed origins via env var, e.g.
//   ALLOWED_DEV_ORIGINS="http://10.155.12.81:3000,http://localhost:3000"
if (process.env.NODE_ENV !== "production") {
  const allowed = parseAllowedDevOrigins(process.env.ALLOWED_DEV_ORIGINS);
  if (allowed.length > 0) {
    (nextConfig as any).allowedDevOrigins = allowed;
  }
}

export default nextConfig;
