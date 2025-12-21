import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';
import forms from '@tailwindcss/forms';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        white: '#ffffff',
        slate: colors.slate,
        indigo: colors.indigo,
        purple: colors.purple,
        brand: {
          50: '#eef5ff',
          100: '#d8e7ff',
          200: '#b1ceff',
          300: '#7baaff',
          400: '#4a85ff',
          500: '#1d5cff',
          600: '#1544d1',
          700: '#1237a5',
          800: '#122f84',
          900: '#132a6c',
        },
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(31, 70, 255, 0.25)',
      },
    },
  },
  plugins: [forms],
};

export default config;
