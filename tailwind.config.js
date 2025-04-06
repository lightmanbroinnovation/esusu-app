/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0072CE", // Example custom color
        primaryText: "#0074FF", // Example primary text color
        inputBg: "#C7C5C5", // Example input background color
        secondary: "#FFFFFF", // Example secondary color
        accent: "#FF5733", // Example accent color
        muted: "#F5F5F5", // Example muted color
      },
    },
  },
  plugins: [],
}