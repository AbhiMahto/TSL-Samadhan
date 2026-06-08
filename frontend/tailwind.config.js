/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f5132', // Dark Green
          dark: '#082d1c',
          light: '#157347',
        },
        secondary: {
          DEFAULT: '#10b981', // Emerald
          dark: '#047857',
          light: '#34d399',
        },
        dark: {
          DEFAULT: '#121212', // Charcoal Background
          card: '#1e1e1e', // Card background
          border: '#2e2e2e',
        }
      },
    },
  },
  plugins: [],
}
