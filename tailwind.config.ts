import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1712",
        surface: "#16211B",
        surfaceRaised: "#1D2B23",
        border: "#2A3A31",
        moss: "#3FA372",
        mossBright: "#54C88D",
        owe: "#E0724F",
        owed: "#54C88D",
        muted: "#8AA096",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
