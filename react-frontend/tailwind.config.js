/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mental-blue': '#6B9AC4',
        'mental-sage': '#A8C5A5',
        'mental-warm': '#E8DCC4',
      }
    },
  },
  plugins: [],
}
