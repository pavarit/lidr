import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Apple-style system font stack
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Apple-inspired neutral palette
        ink: {
          DEFAULT: "#1d1d1f",
          soft: "#6e6e73",
          mute: "#86868b",
        },
        surface: {
          DEFAULT: "#ffffff",
          alt: "#f5f5f7",
          line: "#d2d2d7",
        },
        accent: {
          DEFAULT: "#0071e3",
          hover: "#0077ed",
        },
        bull: "#34c759", // Apple green
        bear: "#ff3b30", // Apple red
        neutral_: "#8e8e93",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
