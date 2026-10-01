import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photo uploads go through Server Actions: up to 3 files x 5MB per request (default cap is 1MB).
    serverActions: { bodySizeLimit: "16mb" },
    // Going back to a page seen in the last 30s shows it instantly instead of re-fetching.
    // Safe with live data: every ticket change calls router.refresh(), which clears this cache.
    staleTimes: { dynamic: 30 },
  },
  // The PDF library loads its own data files from disk, so it must stay an ordinary package.
  serverExternalPackages: ["pdfmake"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
