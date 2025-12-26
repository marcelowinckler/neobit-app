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
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#18181b',
          900: '#000000',
          950: '#000000'
        }
      }
    }
  },
  plugins: []
}
