// postcss.config.js
module.exports = {
    plugins: {
      tailwindcss: {},
      'postcss-lightningcss': {
        drafts: {
          nesting: true,
        },
      },
    },
  };
  