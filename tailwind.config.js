/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        marca: {
          50: '#edf0fa',
          100: '#d6ddf4',
          600: '#22347f',
          700: '#1d2c6c',
          900: '#141f4b',
        },
        'cotepa-rojo': {
          100: '#ffd8df',
          500: '#e3002d',
          600: '#bf0026',
        },
      },
      boxShadow: {
        tarjeta: '0 10px 25px -10px rgba(17, 30, 76, 0.28)',
      },
    },
  },
  plugins: [],
};
