import { networkInterfaces } from "os";
import type { NextConfig } from "next";

function getLanIp(): string | null {
  const nets = networkInterfaces();
  for (const net of Object.values(nets)) {
    for (const iface of net ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const lanIp = getLanIp();
if (lanIp) {
  extraOrigins.push(lanIp);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: Array.from(new Set(extraOrigins)),
};

export default nextConfig;