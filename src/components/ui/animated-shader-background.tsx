"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated aurora / shader background using Three.js WebGL.
 *
 * Renders a fullscreen canvas with a procedural aurora borealis effect driven
 * by a GLSL fragment shader. Mounts as a fixed layer behind everything else.
 *
 * Props:
 *   className  – extra Tailwind classes on the wrapper div
 *   opacity    – overall opacity (0–1, default 1). Useful for blending the
 *                effect over a solid colour instead of full-screen.
 */
export function AnimatedShaderBackground({
  className = "",
  opacity = 1,
}: {
  className?: string;
  opacity?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Three.js setup ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Cap resolution to 1.5x to limit GPU work on high-DPI screens.
    // 1.5x looks identical to 2x at shader distances, half the fragment count.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    // ── Shader material ─────────────────────────────────────────────
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new THREE.Vector2(container.clientWidth, container.clientHeight),
        },
      },
      vertexShader: /* glsl */ `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float iTime;
        uniform vec2  iResolution;

        #define NUM_OCTAVES 3

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u  = fract(p);
          u = u * u * (3.0 - 2.0 * u);
          float res = mix(
            mix(rand(ip),               rand(ip + vec2(1.0, 0.0)), u.x),
            mix(rand(ip + vec2(0.0,1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
            u.y
          );
          return res * res;
        }

        float fbm(vec2 x) {
          float v    = 0.0;
          float a    = 0.3;
          vec2  shift = vec2(100.0);
          mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);
            x  = rot * x * 2.0 + shift;
            a *= 0.4;
          }
          return v;
        }

        void main() {
          vec2 shake = vec2(
            sin(iTime * 1.2) * 0.005,
            cos(iTime * 2.1) * 0.005
          );
          vec2 p = (
            (gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5
          ) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);

          vec2 v;
          vec4 o = vec4(0.0);
          float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

          for (float i = 0.0; i < 28.0; i++) {
            v = p
              + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5
              + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);

            float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 28.0));

            vec4 auroraColors = vec4(
              0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
              0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
              0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3),
              1.0
            );

            vec4 currentContribution =
              auroraColors
              * exp(sin(i * i + iTime * 0.8))
              / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));

            float thinnessFactor = smoothstep(0.0, 1.0, i / 28.0) * 0.6;
            o += currentContribution * (1.0 + tailNoise * 0.8) * thinnessFactor;
          }

          o = tanh(pow(o / 100.0, vec4(1.6)));
          gl_FragColor = o * 1.5;
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Animation loop — capped at 60fps regardless of display refresh rate ──
    let frameId: number;
    let lastTime = 0;
    let paused = false;
    const TARGET_MS = 1000 / 60; // 16.67ms per frame

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      if (paused) return;

      const elapsed = now - lastTime;
      if (elapsed < TARGET_MS - 1) return; // skip frames on 120/144Hz
      lastTime = now - (elapsed % TARGET_MS);

      material.uniforms.iTime.value += Math.min(elapsed, 50) * 0.001; // delta in seconds, capped at 50ms
      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    // Pause rendering when the tab is backgrounded — saves ~100% GPU load
    const handleVisibility = () => {
      paused = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // ── Resize handler ──────────────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.iResolution.value.set(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ─────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden
    />
  );
}
