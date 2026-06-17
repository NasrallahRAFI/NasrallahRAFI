/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
  ],
  safelist: [
    'theme-glass',
    'theme-volt',
    'theme-deepsea',
    'theme-obsidian',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        '.theme-glass': { '--tw-theme-safelist': 'glass' },
        '.theme-volt': { '--tw-theme-safelist': 'volt' },
        '.theme-deepsea': { '--tw-theme-safelist': 'deepsea' },
        '.theme-obsidian': { '--tw-theme-safelist': 'obsidian' },
      })
    },
  ],
}
