/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from design guide
        'ambe-peach': '#FFD3AC',
        'ambe-charcoal': '#353535',
        
        // Neutral colors from design guide
        'ambe-background': '#E5E5E5',
        'ambe-white': '#FFFFFF',
        'ambe-body': '#535353',
        'ambe-grid': '#F4F4F4',
      },
      fontFamily: {
        'richmond': ['Richmond Text', 'serif'],
        'basis': ['Basis Grotesque Arabic Pro', 'sans-serif'],
      },
      fontSize: {
        'h1': '35px',
        'h2': '19px',
        'body': '16px',
      },
    },
  },
  plugins: [],
}