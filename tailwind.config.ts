import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // CampusOrbit brand palette
        navy: {
          50: "#f2f5fa",
          100: "#e4eaf5",
          200: "#c3d0e6",
          300: "#95a9cf",
          400: "#5f7bb2",
          500: "#3d5b96",
          600: "#2c4479",
          700: "#233761",
          800: "#1a2947",
          900: "#101a2e",
          950: "#0a1020",
        },
        orbit: {
          50: "#eef5ff",
          100: "#d9e9ff",
          200: "#bcd8ff",
          300: "#8ec0ff",
          400: "#599dff",
          500: "#3479f6",
          600: "#1f5ce4",
          700: "#1a49c4",
          800: "#1b3e9f",
          900: "#1c377e",
        },
        emeraldx: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,26,46,0.04), 0 8px 24px -12px rgba(16,26,46,0.12)",
        card: "0 1px 3px rgba(16,26,46,0.06), 0 12px 32px -16px rgba(16,26,46,0.18)",
        glow: "0 0 0 1px rgba(52,121,246,0.16), 0 18px 48px -20px rgba(52,121,246,0.45)",
      },
      backgroundImage: {
        "orbit-gradient":
          "linear-gradient(135deg, #1b3e9f 0%, #3479f6 45%, #10b981 130%)",
        "orbit-mesh":
          "radial-gradient(1000px 480px at 12% -8%, rgba(52,121,246,0.16), transparent 60%), radial-gradient(760px 420px at 92% 4%, rgba(16,185,129,0.14), transparent 62%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        spin_slow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "spin-slow": "spin_slow 26s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
