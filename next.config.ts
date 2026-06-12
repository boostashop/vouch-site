import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake the lucide-react icon barrel so only the icons we use ship to
  // the client, instead of pulling the whole index into the bundle.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // The sign-in / sign-up pages submit through Server Actions, whose IDs are
  // tied to the build that rendered the page. By default these pages are
  // statically prerendered and served with `s-maxage=31536000` (one year), so
  // a browser/CDN can hold a year-old copy. After a redeploy the action IDs
  // change and that stale page POSTs a dead action ID — Next throws
  // "Failed to find Server Action … from an older or newer deployment" and the
  // submit silently fails (e.g. a sign-up that never creates an account).
  // Force these auth pages to never be cached so every visit gets the current
  // build's action references.
  async headers() {
    return [
      {
        source: "/auth/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
