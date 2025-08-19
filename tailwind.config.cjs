/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        danger: 'var(--danger)',
        ok: 'var(--ok)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
}
