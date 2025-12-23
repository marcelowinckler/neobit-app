/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e6ebff',
          200: '#cdd6ff',
          300: '#aab8ff',
          400: '#7f8fff',
          500: '#5567ff',
          600: '#394af0',
          700: '#2836c4',
          800: '#1f2b97',
          900: '#1b2676'
        }
      }
    }
  },
  plugins: []
}
