/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom colors for "Sentic" brand
      colors: {
        brand: {
          dark: "#0f172a",
          accent: "#38bdf8",
        },
      },
    },
  },
  plugins: [],
};
