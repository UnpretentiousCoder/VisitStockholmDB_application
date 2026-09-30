/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          bg: '#FFFFFF',
          fg: '#111111',
          surface: '#F5F5F2',
          surfaceAlt: '#EBEBE6',
          muted: '#666666',
          border: '#111111',
          borderLight: '#D9D9D4',
          blue: '#1E4D6B',
          blueLight: '#E8F0F4',
          green: '#315C45',
          amber: '#8A641C',
          red: '#8A3333',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sharp: '2px',
        card: '3px',
      },
    },
  },
  plugins: [],
};
