/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'liquid-bg',
    'liquid-card',
    'liquid-soft',
    'liquid-highlight',
    'blob-layer',
    'blob',
    'blob--blue',
    'blob--indigo',
    'blob--violet',
    'shadow-glow',
    'animate-liquid-float',
    'animate-blob-drift',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Inconsolata',
          'Fira Code',
          'Fira Mono',
          'Droid Sans Mono',
          'Source Code Pro',
          'monospace',
        ],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.011em',
        normal: '0',
        wide: '0.011em',
      },
      colors: {
        glass: {
          base: 'rgba(255,255,255,0.08)',
          stroke: 'rgba(255,255,255,0.24)',
          highlight: 'rgba(255,255,255,0.45)',
        },
        ink: {
          50: '#f6f7fb',
          100: '#eef0f6',
          200: '#d9dced',
          300: '#b9c0dc',
          400: '#8a97c5',
          500: '#5e6da8',
          600: '#485587',
          700: '#3b466e',
          800: '#313a5b',
          900: '#2a334e',
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
      boxShadow: {
        glass:
          '0 1px 0 0 rgba(255,255,255,0.25) inset, 0 10px 30px -10px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(255,255,255,0.2), 0 10px 30px -10px rgba(80,110,255,0.45)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        'liquid-float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.02)' },
        },
        'blob-drift': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(10px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-15px, 10px) scale(0.98)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
      },
      animation: {
        'liquid-float': 'liquid-float 6s ease-in-out infinite',
        'blob-drift': 'blob-drift 18s ease-in-out infinite',
      },
      backgroundImage: {
        'radial-ink':
          'radial-gradient(1200px 600px at 10% -10%, rgba(104,117,245,0.35) 0%, rgba(104,117,245,0) 60%), radial-gradient(800px 500px at 110% 10%, rgba(59,130,246,0.30) 0%, rgba(59,130,246,0) 60%), radial-gradient(900px 600px at 50% 120%, rgba(139,92,246,0.30) 0%, rgba(139,92,246,0) 60%)',
      },
    },
  },
  plugins: [],
};
