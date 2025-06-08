import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#0c161f",
      },
      fontFamily: {
        vietnamese: ['"Noto Serif"', '"Noto Serif Vietnamese"', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
