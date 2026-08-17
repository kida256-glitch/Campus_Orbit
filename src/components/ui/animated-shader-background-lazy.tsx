"use client";

/**
 * Lazy-loaded wrapper for AnimatedShaderBackground.
 *
 * Three.js is ~600KB. This wrapper splits it into its own chunk so it never
 * blocks the initial page parse. The component is only needed client-side
 * after the page has already rendered, so `ssr: false` is safe and correct.
 */

import dynamic from "next/dynamic";

export const AnimatedShaderBackground = dynamic(
  () =>
    import("@/components/ui/animated-shader-background").then(
      (mod) => mod.AnimatedShaderBackground,
    ),
  {
    ssr: false,
    // Render nothing while the chunk loads — the background is decorative,
    // so a missing frame or two on first load is completely fine.
    loading: () => null,
  },
);
