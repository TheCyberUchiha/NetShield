/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup.html",
    "./block.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pureblack: '#000000',
        darkgray: '#18181b',      // subtle borders / button bg
        lightgray: '#27272a',     // border hover / active state
        primary: '#22c55e',       // vibrant green
        mutedgray: '#a1a1aa',     // secondary typography
        purewhite: '#ffffff',
        accentglow: 'rgba(34, 197, 94, 0.15)',
        alertred: '#ef4444'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'shake': 'shake 0.38s cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in': 'fadeIn 0.22s cubic-bezier(0.4, 0, 0.2, 1) both',
        'modal-in': 'modalIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'none' },
          '15%, 45%, 75%': { transform: 'translateX(-6px)' },
          '30%, 60%, 90%': { transform: 'translateX(6px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(5px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          from: { transform: 'translateY(12px) scale(0.97)', opacity: '0' },
          to: { transform: 'none', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
