/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'header': ['Quicksand', 'sans-serif'],
        'body': ['Outfit', 'sans-serif'],
      },
      colors: {
        accent: 'var(--accent-color)',
        'accent-light': 'var(--accent-light)',
        'accent-border': 'var(--accent-border)',
        'bg-primary': 'var(--bg-primary)',
        'bg-card': 'var(--bg-card)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-color': 'var(--border-color)',
      },
    },
  },
  plugins: [],
}
