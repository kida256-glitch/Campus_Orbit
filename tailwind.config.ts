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
        "3xl": "calc(var(--radius) + 16px)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,26,46,0.04), 0 8px 24px -12px rgba(16,26,46,0.12)",
        card: "0 1px 3px rgba(16,26,46,0.06), 0 12px 32px -16px rgba(16,26,46,0.18)",
        glow: "0 0 0 1px rgba(52,121,246,0.16), 0 18px 48px -20px rgba(52,121,246,0.45)",
        "glow-lg": "0 0 0 1px rgba(52,121,246,0.2), 0 32px 80px -24px rgba(52,121,246,0.55)",
        "glow-emerald": "0 0 0 1px rgba(16,185,129,0.18), 0 18px 48px -20px rgba(16,185,129,0.38)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.12)",
        "lift": "0 4px 6px -1px rgba(16,26,46,0.06), 0 20px 40px -12px rgba(16,26,46,0.22)",
      },
      backgroundImage: {
        "orbit-gradient":
          "linear-gradient(135deg, #1b3e9f 0%, #3479f6 45%, #10b981 130%)",
        "orbit-gradient-radial":
          "radial-gradient(ellipse at top left, #3479f6 0%, #1b3e9f 60%, #10b981 100%)",
        "orbit-mesh":
          "radial-gradient(1000px 480px at 12% -8%, rgba(52,121,246,0.16), transparent 60%), radial-gradient(760px 420px at 92% 4%, rgba(16,185,129,0.14), transparent 62%)",
        "orbit-mesh-strong":
          "radial-gradient(800px 400px at 0% 0%, rgba(52,121,246,0.22), transparent 55%), radial-gradient(600px 360px at 100% 0%, rgba(16,185,129,0.18), transparent 58%), radial-gradient(500px 300px at 50% 100%, rgba(26,62,159,0.12), transparent 70%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)",
        "stat-blue": "linear-gradient(135deg, #eef5ff 0%, #dbeafe 100%)",
        "stat-emerald": "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
        "stat-amber": "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        "stat-navy": "linear-gradient(135deg, #f2f5fa 0%, #e4eaf5 100%)",
        "stat-red": "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
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
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up-sm": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-scale": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        spin_slow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-6px) rotate(1.5deg)" },
          "66%": { transform: "translateY(-3px) rotate(-1deg)" },
        },
        pulse_glow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(52,121,246,0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(52,121,246,0.25)" },
        },
        "border-beam": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "fade-up-sm": "fade-up-sm 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-in-scale": "fade-in-scale 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-left": "slide-in-left 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-right": "slide-in-right 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "spin-slow": "spin_slow 26s linear infinite",
        "spin-reverse-slow": "spin-reverse 32s linear infinite",
        float: "float 5s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "pulse-glow": "pulse_glow 2.5s ease-in-out infinite",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "gradient-shift": "gradient-shift 4s ease infinite",
        wiggle: "wiggle 0.5s ease-in-out",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
