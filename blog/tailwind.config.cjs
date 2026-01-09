/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        header: ['Quicksand', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#FF4761',
          light: '#FFE4E8',
          border: '#FFB3C1',
        },
      },
    },
  },
  plugins: [],
};
