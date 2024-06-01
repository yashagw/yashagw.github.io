import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    colors: {
      "primary-text": "rgba(255, 255, 255, 0.85)",
      "secondary-text": "rgba(255, 255, 255, 0.6)",
      "tertiary-text": "rgba(255, 255, 255, 0.3)",
    },
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config