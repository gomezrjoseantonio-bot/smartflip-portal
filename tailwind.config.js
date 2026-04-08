/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#4ECDC4',
          green: '#2ECC71',
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4ECDC4, #2ECC71)',
      }
    }
  },
  plugins: []
}

