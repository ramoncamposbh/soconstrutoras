import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0faf7',
          100: '#d1f0e8',
          200: '#a3e1d0',
          300: '#6bcbb5',
          400: '#3aaf96',
          500: '#0E8F6E',
          600: '#0b7459',
          700: '#085944',
          800: '#053e2f',
          900: '#04241D',
        },
        brand: '#0E8F6E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
