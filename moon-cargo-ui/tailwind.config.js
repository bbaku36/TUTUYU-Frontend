/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: '#FDBF56',
        midnight: '#080808',
        accent: '#FF5C4D',
        cream: '#FFE9B3',
      },
      fontFamily: {
        rounded: ['"Baloo 2"', 'cursive'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 15px 40px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
