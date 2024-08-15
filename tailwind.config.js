// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        custom: "75rem", // This creates a custom max-width (e.g., 1200px)
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#333",
            a: {
              color: "#1a202c",
              "&:hover": {
                color: "#2d3748",
              },
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
