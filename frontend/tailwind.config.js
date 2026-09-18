/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          dark: '#1B5E20',
          primary: '#2E7D32',
          secondary: '#43A047',
          light: '#E8F5E9',
          accent: '#F9A825',
          earth: '#795548',
          bg: '#F7FAF7',
          textDark: '#263238',
          textMuted: '#607D8B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
