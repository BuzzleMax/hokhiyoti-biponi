import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',

  theme: {
    extend: {
            colors: {
        primary: '#111111',
        background: '#FAF9F6',
        surface: '#FFFFFF',
        accent: '#B08D57',
        secondary: '#666666',
        border: 'rgba(0,0,0,0.06)',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '2xl': '16px',
      },
      letterSpacing: {
        tight: '-0.02em',
        wide: '0.08em',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}

export default config



