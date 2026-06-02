/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orion: {
          navy: "#0b1f3a",
          blue: "#1677ff",
          light: "#f4f7fb",
          border: "#dbe3ef",
          text: "#172033"
        }
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(11, 31, 58, 0.08)"
      }
    }
  },
  plugins: []
};
