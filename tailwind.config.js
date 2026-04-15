/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        primary: '#b23a48',
        'primary-hover': '#8f2e3a',
        'sidebar-bg': '#d4737f',
        'sidebar-header': '#8f2e3a',
        'sidebar-active': '#6b1f28',
        dark: '#050415',
      }
    }
  },
  plugins: [],
}
