/** @type {import('tailwindcss').Config} */
export const content = [
  './app/**/*.{js,ts,jsx,tsx}',
  './pages/**/*.{js,ts,jsx,tsx}',
  './components/**/*.{js,ts,jsx,tsx}',
];
export const theme = {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#2563eb',
        dark: '#1d4ed8',
        light: '#3b82f6',
      },
      secondary: {
        DEFAULT: '#7c3aed',
        dark: '#6d28d9',
        light: '#8b5cf6',
      },
      accent: {
        DEFAULT: '#06b6d4',
        dark: '#0891b2',
        light: '#22d3ee',
      },
    },
    fontFamily: {
      lexend: ['var(--font-lexend)'],
      comfortaa: ['var(--font-comfortaa)'],
      geist: ['var(--font-geist-sans)'],
      geistmono: ['var(--font-geist-mono)'],
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.5s ease-out',
      'slide-down': 'slideDown 0.5s ease-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
    },
  },
};
export const plugins = [];
