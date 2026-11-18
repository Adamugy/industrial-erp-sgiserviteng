/** @type {import('tailwindcss').Config} */
// Design tokens for SGIServiteng. Colours are intentionally the stock Tailwind
// palette the app already used (slate / indigo / emerald / status hues): only
// typography, radius, elevation and motion are tokenised here.
export default {
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}'],
  darkMode: 'media', // same behaviour as the former Tailwind Play CDN default
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Micro type floor: nothing below 10px; labels/badges use 11px.
        '3xs': ['10px', { lineHeight: '0.875rem' }],
        '2xs': ['11px', { lineHeight: '1rem' }],
      },
      borderRadius: {
        // control: inputs, buttons · card: tiles, rows · panel: page sections
        control: '0.75rem',
        card: '1rem',
        panel: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.04)',
        raised: '0 12px 32px -12px rgb(15 23 42 / 0.18)',
        overlay: '0 24px 64px -16px rgb(15 23 42 / 0.35)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'fade-in': 'fade-in 0.2s ease-out both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
