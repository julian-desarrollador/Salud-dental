import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
