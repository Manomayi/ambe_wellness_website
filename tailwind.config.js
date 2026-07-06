/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ambe-dark': '#1A1A1A',
        'ambe-charcoal': '#353535',
        'ambe-gold': '#C8996A',
        'ambe-peach': '#FFD3AC',
        'ambe-cream': '#F4F1EA',
        peach: '#FFD3AC',
        charcoal: '#353535',
        body: '#353535',
      },
      fontFamily: {
        heading: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-jost)', 'Jost', sans-serif],
      },
      fontSize: {
        h1: '35px',
        h2: '19px',
        body: '16px',
      },
    },
  },
  plugins: [],
};
