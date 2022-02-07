const { fontFamily, screens } = require("tailwindcss/defaultTheme")

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
    colors: {
      light: "#f4f4f4",
      dark: "#0e0e0e",
      green: "#c1eb7c",
      orange: "#daa27a",
      card: "#1c1d1a",
      placeholder: "#666666",
    },
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
}
