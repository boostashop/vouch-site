import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake the lucide-react icon barrel so only the icons we use ship to
  // the client, instead of pulling the whole index into the bundle.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
