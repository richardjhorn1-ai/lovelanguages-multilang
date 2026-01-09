// Isolated PostCSS config for blog - prevents v4 conflict from parent
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
