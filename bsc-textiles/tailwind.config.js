/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#080C16', 900: '#05070E', 800: '#0A0F1C', 700: '#101827', 600: '#16203A' },
        ivory: '#F4EFE6',
        champagne: { DEFAULT: '#D9C08A', light: '#E7CE9C', deep: '#BFA06A' },
        gold: { DEFAULT: '#C9A227', soft: '#E3C77E' },
        beige: '#D8C7A9',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Jost', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: { luxe: '0.42em', wide2: '0.22em' },
      screens: { xs: '420px', '3xl': '1800px' },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.16, 1, 0.3, 1)',
        drape: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        floatY: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        weave: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '160px 160px' } },
        pulseGold: {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        scrollHint: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '40%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        floatY: 'floatY 7s cubic-bezier(0.45,0,0.55,1) infinite',
        shimmer: 'shimmer 2.6s cubic-bezier(0.16,1,0.3,1)',
        weave: 'weave 18s linear infinite',
        pulseGold: 'pulseGold 3.4s ease-in-out infinite',
        scrollHint: 'scrollHint 2.2s ease-in-out infinite',
        spinSlow: 'spinSlow 26s linear infinite',
      },
    },
  },
  plugins: [],
};
