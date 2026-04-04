/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        helios: {
          dark:  "#0A0F1E",
          card:  "#131928",
          gold:  "#F5A623",
          lgold: "#FFC85A",
          warm:  "#FF6B35",
          muted: "#8A96B0",
        },
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans:  ["Trebuchet MS", "sans-serif"],
      },
    },
  },
  plugins: [],
};
