/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF6EF",
        ink: "#1F2D27",
        sage: {
          DEFAULT: "#4F7A6B",
          light: "#EAF1ED",
          dark: "#365A4D",
        },
        saffron: {
          DEFAULT: "#E2A33D",
          light: "#FBEFD9",
        },
        coral: "#D6604A",
        perforation: "#D8D0C0",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      keyframes: {
        pulseOnce: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        pulseOnce: "pulseOnce 0.5s ease-out",
      },
    },
  },
  plugins: [],
};
