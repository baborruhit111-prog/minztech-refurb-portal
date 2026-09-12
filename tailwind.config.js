/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          neon: '#ccff33',
          lime: '#cee56c',
          dark: '#1a1a1a',
          black: '#121212',
          surface: '#242424',
          card: '#1f1f1f',
          border: '#333333',
          hover: '#2a2a2a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
