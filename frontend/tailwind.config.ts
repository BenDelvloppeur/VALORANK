import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Valorant-inspired
        background: '#0F1419',
        surface: '#161B22',
        'surface-2': '#1C232C',
        border: '#2A323D',
        muted: '#8B949E',
        foreground: '#ECE8E1',

        primary: {
          DEFAULT: '#FF4655',
          50: '#FFE8EA',
          100: '#FFC9CE',
          200: '#FF9098',
          300: '#FF5762',
          400: '#FF4655',
          500: '#E8323F',
          600: '#C81E2A',
          700: '#9A1721',
          800: '#6E1018',
          900: '#48070D',
        },
        accent: {
          DEFAULT: '#36D2C5',
          400: '#5DDED3',
          500: '#36D2C5',
          600: '#28A89D',
        },
        gold: '#FFC857',
        success: '#3FB950',
        danger: '#F85149',
        warning: '#D29922',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-display)', 'var(--font-inter)', 'ui-sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,70,85,0.4), 0 8px 30px -10px rgba(255,70,85,0.45)',
        'glow-accent':
          '0 0 0 1px rgba(54,210,197,0.35), 0 8px 30px -10px rgba(54,210,197,0.4)',
        card: '0 4px 24px -6px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'hero-radial':
          'radial-gradient(circle at 20% 0%, rgba(255,70,85,0.18), transparent 50%), radial-gradient(circle at 80% 50%, rgba(54,210,197,0.12), transparent 60%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
