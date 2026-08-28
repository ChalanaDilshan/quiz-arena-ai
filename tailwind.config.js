/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Toggle the 'dark' class on <html> to switch themes
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // ── All colors are CSS custom properties so they respond
      //    automatically to the light / dark class on <html>. ──────────
      colors: {
        canvas:        'var(--color-canvas)',
        elevated:      'var(--color-elevated)',
        rim:           'var(--color-rim)',
        alabaster:     'var(--color-alabaster)',
        smoke:         'var(--color-smoke)',
        sienna:        'var(--color-sienna)',
        'sienna-wash': 'var(--color-sienna-wash)',
        'sienna-dim':  'var(--color-sienna-dim)',
      },
      animation: {
        'slide-up':   'slide-up 0.45s cubic-bezier(0.22,1,0.36,1)',
        'fade-in':    'fade-in 0.28s ease-out',
        'bounce-in':  'bounce-in 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)',
        'float':      'float 4s ease-in-out infinite',
        'spin-slow':  'spin 6s linear infinite',
      },
      keyframes: {
        'slide-up':  { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'bounce-in': { from: { transform: 'scale(0.65)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'float':     { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
};
