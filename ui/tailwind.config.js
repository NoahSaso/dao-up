const { fontFamily, screens } = require("tailwindcss/defaultTheme")
const { colors } = require("./helpers/theme")

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./helpers/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      ...fontFamily,
      sans: ["DM Sans", ...fontFamily.sans],
    },
    colors,
    screens: {
      xs: "420px",
      ...screens,
    },
    extend: {
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      height: {
        footer: "9rem",
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
}
