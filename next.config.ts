import type { NextConfig } from "next";
const nextConfig: NextConfig = { turbopack: { root: process.cwd() }, images: { remotePatterns: [{ protocol: "https", hostname: "sleepercdn.com", pathname: "/avatars/**" }] }, devIndicators: false };
export default nextConfig;
