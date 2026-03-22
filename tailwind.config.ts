import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Gaming theme colors
        "cyber-blue": "hsl(var(--cyber-blue))",
        "neon-purple": "hsl(var(--neon-purple))",
        "electric-green": "hsl(var(--electric-green))",
        "cyber-gold": "hsl(var(--cyber-gold))",
        "neon-pink": "hsl(var(--neon-pink))",
        "plasma-orange": "hsl(var(--plasma-orange))",
        // Legacy Gold colors
        "gold-primary": "hsl(var(--gold-primary))",
        "gold-secondary": "hsl(var(--gold-secondary))",
        // Background variants
        "dark-bg": "hsl(var(--dark-bg))",
        "darker-bg": "hsl(var(--darker-bg))",
        "card-bg": "hsl(var(--card-bg))",
        "card-bg-alt": "hsl(var(--card-bg-alt))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        gaming: ["'Orbitron'", "'Poppins'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-gaming": "linear-gradient(135deg, hsl(var(--cyber-blue)) 0%, hsl(var(--neon-purple)) 50%, hsl(var(--neon-pink)) 100%)",
        "gradient-gold": "linear-gradient(135deg, hsl(var(--cyber-gold)) 0%, hsl(var(--gold-secondary)) 100%)",
        "gradient-dark": "linear-gradient(180deg, hsl(var(--dark-bg)) 0%, hsl(var(--darker-bg)) 100%)",
        "gradient-radial": "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glow-blue": "0 0 20px hsl(var(--cyber-blue) / 0.5), 0 0 40px hsl(var(--cyber-blue) / 0.3)",
        "glow-purple": "0 0 20px hsl(var(--neon-purple) / 0.5), 0 0 40px hsl(var(--neon-purple) / 0.3)",
        "glow-gold": "0 0 20px hsl(var(--cyber-gold) / 0.5), 0 0 40px hsl(var(--cyber-gold) / 0.3)",
        "glow-pink": "0 0 20px hsl(var(--neon-pink) / 0.5), 0 0 40px hsl(var(--neon-pink) / 0.3)",
        "card-hover": "0 20px 40px hsl(var(--cyber-blue) / 0.2)",
        "game-card": "0 10px 30px hsl(var(--neon-purple) / 0.3)",
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
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px hsl(var(--cyber-gold) / 0.5)" },
          to: { boxShadow: "0 0 40px hsl(var(--cyber-gold) / 0.8)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--cyber-blue) / 0.5)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--cyber-blue) / 0.8), 0 0 60px hsl(var(--cyber-blue) / 0.4)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slide: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "gradient-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
        slide: "slide 20s linear infinite",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        twinkle: "twinkle 3s ease-in-out infinite",
        "gradient-flow": "gradient-flow 4s ease infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
