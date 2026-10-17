/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF1FB',
          100: '#D6E3F7',
          200: '#ADC7EF',
          300: '#7FA6E3',
          400: '#4B82D3',
          500: '#1565C0',
          600: '#0F52A0',
          700: '#0B3D91',
          800: '#0A3275',
          900: '#082659',
          950: '#051838',
        },
        signal: {
          DEFAULT: '#F4511E',
          dark: '#D84315',
          soft: '#FFF1EC',
          ink: '#B33A10',
        },
        success: {
          DEFAULT: '#2E7D32',
          soft: '#EAF5EB',
          ink: '#1B5E20',
        },
        danger: {
          DEFAULT: '#C62828',
          soft: '#FDECEC',
          ink: '#9B1C1C',
        },
        mist: '#F7F9FC',
        night: {
          DEFAULT: '#0D1117',
          800: '#111827',
          700: '#161F2E',
          600: '#1B2637',
        },
        ink: '#0F172A',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,61,145,0.05), 0 12px 32px -18px rgba(11,61,145,0.28)',
        lift: '0 2px 4px rgba(11,61,145,0.06), 0 24px 48px -24px rgba(11,61,145,0.35)',
        board: '0 20px 60px -30px rgba(5,24,56,0.75)',
      },
      backgroundImage: {
        'hero-grid':
          "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
        'hero-glow':
          'radial-gradient(ellipse 70% 60% at 75% 0%, rgba(21,101,192,0.55), transparent 65%), radial-gradient(ellipse 50% 50% at 5% 100%, rgba(244,81,30,0.16), transparent 70%)',
      },
      backgroundSize: {
        grid: '46px 46px',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'train-run': {
          '0%': { offsetDistance: '0%' },
          '100%': { offsetDistance: '100%' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        ticker: 'ticker 38s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
};

module.exports = config;
