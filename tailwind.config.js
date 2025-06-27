/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // Add this line to scan all JS/JSX/TS/TSX files in the src folder
  ],
  theme: {
    extend: 
    {
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        'short': { raw: '(max-height: 600px)' },
        'mobile-short': { raw: '(max-width: 768px) and (max-height: 700px)' },
        'mobile-very-short': { raw: '(max-width: 768px) and (max-height: 500px)' },
        'mobile-extremely-short': { raw: '(max-width: 768px) and (max-height: 400px)' },
      },
      height: {
        'screen-small': '100svh',
        'screen-dynamic': '100dvh',
      },
      minHeight: {
        'screen-small': '100svh',
        'screen-dynamic': '100dvh',
      },
      maxHeight: {
        'screen-small': '100svh',
        'screen-dynamic': '100dvh',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          md: '2rem',
          lg: '2.5rem',
          xl: '3rem',
          '2xl': '4rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
          '3xl': '1920px',
        },
      },
    },
  },
  plugins: [],
};
