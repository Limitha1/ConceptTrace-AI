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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          indigo: '#4f46e5',
          purple: '#7c3aed',
          lavender: '#f3f0ff',
          pastelBlue: '#f0f7ff',
          mint: '#10b981',
          mintLight: '#ecfdf5',
          sky: '#0ea5e9',
          skyLight: '#f0f9ff',
          coral: '#f43f5e',
          coralLight: '#fff1f2',
          amber: '#f59e0b',
          amberLight: '#fffbeb',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(99, 102, 241, 0.06), 0 4px 16px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(99, 102, 241, 0.12), 0 6px 16px -2px rgba(0, 0, 0, 0.05)',
        'soft': '0 4px 20px -2px rgba(79, 70, 229, 0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
