const { fontFamily } = require("tailwindcss/defaultTheme")

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      ...fontFamily,
      sans: ["DM Sans", ...fontFamily.sans],
    },
    colors: {
      green: "#c1eb7c",
      light: "#eeeeee",
      dark: "#0e0e0e",
    },
  },
}
