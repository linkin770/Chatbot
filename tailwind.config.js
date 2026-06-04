/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        // Distinctive display & body pairing inspired by Linear's refined
        // editorial typography. Geist Sans is the modern workhorse;
        // Instrument Serif provides moments of editorial contrast.
        sans: [
          'InterVariable',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'Instrument Serif',
          'GT Super Display',
          'Tiempos Headline',
          'serif',
        ],
        mono: [
          'JetBrains Mono',
          'Berkeley Mono',
          'SF Mono',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        // Linear-inspired neutral palette. Cool, paper-white surfaces with
        // whisper-thin borders and carefully tuned gray steps.
        ink: {
          50: '#FFFFFF',
          75: '#FBFBFB',
          100: '#F8F8F8',
          150: '#F4F4F4',
          200: '#EFEFEF',
          250: '#E9E9E9',
          300: '#DCDCDC',
          400: '#B8B8B8',
          500: '#8A8A8A',
          600: '#6E6E6E',
          700: '#525252',
          800: '#363636',
          900: '#1F1F1F',
          950: '#0E0E0E',
        },
        accent: {
          // A single accent — deep indigo. Used sparingly for selection,
          // send button, and active states.
          50: '#EEF0FF',
          100: '#DDE1FF',
          200: '#B9C0FF',
          300: '#8E97FF',
          400: '#6E6CFF',
          500: '#5B5BD6',
          600: '#4845B0',
          700: '#3A388C',
        },
      },
      boxShadow: {
        // Multi-layer, very soft shadows that hint at depth without
        // dominating the surface. Linear keeps them almost imperceptible.
        'soft-sm': '0 1px 1px rgba(15, 15, 20, 0.04), 0 0 0 1px rgba(15, 15, 20, 0.04)',
        soft: '0 1px 2px rgba(15, 15, 20, 0.04), 0 4px 12px rgba(15, 15, 20, 0.04), 0 0 0 1px rgba(15, 15, 20, 0.04)',
        'soft-lg':
          '0 2px 4px rgba(15, 15, 20, 0.04), 0 12px 32px rgba(15, 15, 20, 0.06), 0 0 0 1px rgba(15, 15, 20, 0.04)',
        ring: '0 0 0 1px rgba(15, 15, 20, 0.06)',
      },
      borderRadius: {
        // Restrained radii, just enough to feel modern.
        xl: '10px',
        '2xl': '14px',
        '3xl': '20px',
      },
      transitionTimingFunction: {
        // Linear's signature "decelerate" ease — feels expensive.
        linear: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slide-in-left 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
