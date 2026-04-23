/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vmdark: '#0f172a',
        vmgold: '#fbbf24',
      }
    },
  },
  plugins: [],
}
