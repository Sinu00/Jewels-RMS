import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#B8860B',
          light: '#D4A017',
          dark: '#8B6508',
        },
        bg: '#F8F8F6',
        card: '#FFFFFF',
        ink: '#1A1A16',
        muted: '#888580',
        border: '#EDEBE5',
        surface: '#F2F1EE',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-dm-serif)', 'serif'],
      },
      borderRadius: {
        '3xl': '24px',
        '2xl': '20px',
        xl: '16px',
        lg: '12px',
        md: '8px',
        sm: '6px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(26, 26, 22, 0.08)',
        nav: '0 8px 32px rgba(26, 26, 22, 0.20)',
        float: '0 4px 24px rgba(26, 26, 22, 0.14)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      })
    },
  ],
}

export default config
