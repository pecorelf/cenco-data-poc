/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cenco: {
          DEFAULT: "#0B57A4",
          deep: "#063B72",
          soft: "#E4EDF7",
          line: "#C9DAEC",
        },
        naranjo: "#F57200",
        certif: "#1E7A46",
        certifsoft: "#E3F1E9",
        papel: "#F4F6FA",
        tinta: "#12212F",
        gris: "#5A6B7D",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
      },
    },
  },
  plugins: [],
};
