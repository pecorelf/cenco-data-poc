/** @type {import('tailwindcss').Config} */

// Tokens del design system de Cencosud.
// Azul y naranjo muestreados del logo oficial entregado por el cliente.
// Tipografía corporativa: Raleway.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cenco: {
          DEFAULT: "#095AA5",
          deep: "#064174",
          mid: "#3A7BB7",
          soft: "#E6EFF8",
          line: "#D3E2F0",
        },
        naranjo: {
          DEFAULT: "#FF690A",
          soft: "#FFF1E6",
          deep: "#C64E00",
        },
        certif: { DEFAULT: "#1B7A4B", soft: "#E6F3EC" },
        tuna: "#3B3D40",
        papel: "#F5F7FA",
        gris: "#6B7480",
      },
      fontFamily: {
        sans: ["Raleway", "system-ui", "sans-serif"],
      },
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.015em" }],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
      },
      boxShadow: {
        suave: "0 1px 2px rgba(6,65,116,.05), 0 4px 14px rgba(6,65,116,.06)",
        alto: "0 2px 6px rgba(6,65,116,.08), 0 16px 40px rgba(6,65,116,.12)",
      },
      transitionTimingFunction: {
        cenco: "cubic-bezier(.22,.7,.28,1)",
      },
    },
  },
  plugins: [],
};
