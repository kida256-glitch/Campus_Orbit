import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    // Remote banners are decorative and rendered small; trimming the generated
    // variants cuts optimisation work and cache churn.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 2_678_400, // 31 days — these URLs are immutable
  },

  experimental: {
    // Server Actions are used for every mutation in CampusOrbit.
    serverActions: { bodySizeLimit: "2mb" },

    /*
     * Rewrite barrel imports to direct module paths.
     *
     * `lucide-react` ships ~3,500 icons behind a single entry point. Without
     * this, importing six icons pulls the whole barrel into the module graph,
     * which was the largest single contributor to slow dev compiles. `recharts`
     * and `date-fns` are large barrels for the same reason.
     */
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },

  // Strip console output from production bundles, keeping error/warn.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
