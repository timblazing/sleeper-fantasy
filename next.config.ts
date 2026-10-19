import type { NextConfig } from "next";
// Every <Image> already opts out of optimization; disabling it app-wide keeps the Worker off the Images binding.
const nextConfig: NextConfig = { turbopack: { root: process.cwd() }, images: { unoptimized: true }, devIndicators: false };
export default nextConfig;
