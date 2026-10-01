/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        ink: {
          50:  '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
          950: '#05070d',
        },
        surface: {
          DEFAULT: '#0d121c',
          raised: '#111827',
          border: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.04)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.2), 0 4px 16px -4px rgba(0,0,0,0.3)',
        glow: '0 6px 20px -6px rgba(16,185,129,.5)',
        elevated: '0 12px 32px -8px rgba(0,0,0,.6)',
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.2,.8,.2,1) both',
        'fade-in': 'fade-in .25s ease both',
        'spin-slow': 'spin-slow 1.2s linear infinite',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
};
