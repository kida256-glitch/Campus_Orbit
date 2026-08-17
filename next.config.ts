import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "nhorfibqbbumrjwjxiwb.supabase.co" },
    ],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 2_678_400,
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "three"],
    // Preload critical data in parallel across route segments
    parallelServerBuildTraces: true,
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Aggressively cache static assets
  headers: async () => [
    {
      source: "/_next/static/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/(.*\\.(?:ico|svg|png|jpg|jpeg|webp|avif|woff2?))",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=2678400, stale-while-revalidate=86400",
        },
      ],
    },
  ],

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
