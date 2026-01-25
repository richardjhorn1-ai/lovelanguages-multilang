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
      fontSize: {
        // Theme-aware text scale - respects user's size preference (small/medium/large)
        // and automatically adjusts for mobile vs desktop
        'scale-micro': ['var(--text-micro)', { lineHeight: 'var(--line-height-tight)' }],
        'scale-caption': ['var(--text-caption)', { lineHeight: 'var(--line-height-tight)' }],
        'scale-label': ['var(--text-label)', { lineHeight: 'var(--line-height-normal)' }],
        'scale-button': ['var(--text-button)', { lineHeight: 'var(--line-height-tight)' }],
        'scale-body': ['var(--text-body)', { lineHeight: 'var(--line-height-relaxed)' }],
        'scale-heading': ['var(--text-heading)', { lineHeight: 'var(--line-height-tight)' }],
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
      animation: {
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'flash-red': 'flash-red 0.5s ease-out',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        'flash-red': {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
