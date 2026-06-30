import type { NextConfig } from "next";

// Static export para GitHub Pages (project site bajo /sereno-test-bench).
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/sereno-test-bench",
  images: { unoptimized: true },
};

export default nextConfig;
