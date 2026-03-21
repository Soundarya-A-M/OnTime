/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // FIX #19: safelist dynamic classes that are built via string interpolation
  // Without this, Tailwind's JIT purges them in production builds
  safelist: [
    // Gradient directions used in dynamic stat cards / feature cards
    { pattern: /^from-(purple|pink|blue|cyan|green|emerald|orange|red|amber|indigo|yellow|gray|slate)-(400|500|600)$/ },
    { pattern: /^to-(purple|pink|blue|cyan|green|emerald|orange|red|amber|indigo|yellow|gray|slate)-(400|500|600)$/ },
    { pattern: /^via-(purple|pink|blue|cyan|green|emerald|orange|red|amber|indigo|yellow|gray|slate)-(400|500|600|900)$/ },
    // Background opacity variants used in status badges
    { pattern: /^bg-(green|red|yellow|blue|purple|amber|gray|orange)-(500)\/(10|20|30|40)$/ },
    // Text color variants for status labels
    { pattern: /^text-(green|red|yellow|blue|purple|amber|gray|orange)-(300|400)$/ },
    // Border variants for status badges
    { pattern: /^border-(green|red|yellow|blue|purple|amber|gray|orange)-(500)\/(20|30|40)$/ },
  ],
}
