/** @type {import('tailwindcss').Config} */

module.exports = {
  mode: 'jit',
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        interYellow: 'var(--inter-yellow)',
        interOrange: 'var(--inter-orange)',
        mineShaft: 'var(--color-mineShaft)',
      },
      fontFamily: {
        sans: [
          'Roboto',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
      },
    },
  },
  plugins: [],
};
