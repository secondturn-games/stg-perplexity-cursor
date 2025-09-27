import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4f0',
          100: '#dde7dd',
          200: '#bdd1bd',
          300: '#90b390',
          400: '#5c8b5c',
          500: '#29432B',
          600: '#243825',
          700: '#1e2e1f',
          800: '#1a251a',
          900: '#161e17',
          950: '#0b0f0b',
        },
        accent: {
          50: '#fef3f0',
          100: '#fee5dd',
          200: '#fccdb8',
          300: '#f9a889',
          400: '#f67a58',
          500: '#D95323',
          600: '#c53e1c',
          700: '#a4321a',
          800: '#872b1d',
          900: '#6f271c',
          950: '#3c110d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#F2C94C',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        background: {
          50: '#f9faf8',
          100: '#E6EAD7',
          200: '#d7ddc6',
          300: '#c1caa8',
          400: '#a5b185',
          500: '#8a9768',
          600: '#6d7a4e',
          700: '#56613e',
          800: '#484e35',
          900: '#3e422e',
          950: '#202314',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Righteous', 'cursive'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
