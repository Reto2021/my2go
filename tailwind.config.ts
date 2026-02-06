import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
      },
    },
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
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
      },
      fontFamily: {
        heading: ["'Montserrat'", "system-ui", "sans-serif"],
        body: ["'Open Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "display-lg": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "18": "4.5rem",
        "22": "5.5rem",
      },
      boxShadow: {
        "soft": "0 2px 8px -2px rgb(0 0 0 / 0.08)",
        "medium": "0 4px 16px -4px rgb(0 0 0 / 0.1)",
        "strong": "0 8px 32px -8px rgb(0 0 0 / 0.15)",
        "glow-accent": "0 0 40px hsl(43 95% 55% / 0.3)",
        "card-brand": "0 8px 32px hsl(174 70% 5% / 0.5)",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "equalizer-1": {
          "0%, 100%": { height: "4px" },
          "50%": { height: "16px" },
        },
        "equalizer-2": {
          "0%, 100%": { height: "12px" },
          "25%": { height: "4px" },
          "75%": { height: "16px" },
        },
        "equalizer-3": {
          "0%, 100%": { height: "8px" },
          "33%": { height: "16px" },
          "66%": { height: "4px" },
        },
        "equalizer-4": {
          "0%, 100%": { height: "14px" },
          "40%": { height: "6px" },
          "80%": { height: "12px" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "gradient-shift": {
          "0%": { transform: "translate(-30%, -30%) rotate(0deg)" },
          "100%": { transform: "translate(-30%, -30%) rotate(360deg)" },
        },
        "brush-stroke": {
          "0%": { transform: "scaleX(0) rotate(-1deg)", transformOrigin: "left", opacity: "0.8" },
          "50%": { transform: "scaleX(1.05) rotate(0.5deg)", opacity: "1" },
          "75%": { transform: "scaleX(0.98) rotate(-0.3deg)", opacity: "1" },
          "100%": { transform: "scaleX(1) rotate(-0.5deg)", transformOrigin: "left", opacity: "1" },
        },
        "pulse-play": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 hsl(44 98% 49% / 0.4)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 8px hsl(44 98% 49% / 0)" },
        },
        "bounce-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
        "wiggle-hint": {
          "0%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(24px)" },
          "30%": { transform: "translateX(12px)" },
          "45%": { transform: "translateX(20px)" },
          "60%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "equalizer-1": "equalizer-1 0.8s ease-in-out infinite",
        "equalizer-2": "equalizer-2 0.6s ease-in-out infinite",
        "equalizer-3": "equalizer-3 0.7s ease-in-out infinite",
        "equalizer-4": "equalizer-4 0.5s ease-in-out infinite",
        "marquee": "marquee 12s linear infinite",
        "marquee-slow": "marquee 25s linear infinite",
        "gradient-shift": "gradient-shift 30s linear infinite",
        "brush-stroke": "brush-stroke 0.7s ease-out forwards",
        "pulse-play": "pulse-play 2s ease-in-out infinite",
        "bounce-x": "bounce-x 1s ease-in-out infinite",
        "wiggle-hint": "wiggle-hint 1.2s ease-in-out",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
