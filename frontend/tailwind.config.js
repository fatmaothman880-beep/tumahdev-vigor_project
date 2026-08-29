/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14181A",
        "ink-soft": "#3F4A47",
        paper: "#F7F5F0",
        line: "#E1DED4",
        "line-strong": "#C9C4B6",
        brand: {
          green: "#0C9349",
          "green-deep": "#0A7A3D",
          "green-tint": "#E7F4EB",
        },
        teal: {
          DEFAULT: "#0E7C86",
          tint: "#E4F1F2",
        },
        sand: {
          DEFAULT: "#C99A5B",
          tint: "#F4EBDB",
        },
        amber: {
          DEFAULT: "#B5760F",
          tint: "#FBF0DD",
        },
        danger: {
          DEFAULT: "#AE3B2E",
          tint: "#F8E7E3",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
