/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Mappa dei design tokens del progetto.
      // Usabili come bg-ink, text-violet, border-ink, etc.
      colors: {
        cream:   { DEFAULT: '#FAF6EB', 2: '#F2EBD8' },
        ink:     { DEFAULT: '#1A1726', 2: '#2C2740', soft: '#5A536D' },
        violet:  { DEFAULT: '#7C5BFF', deep: '#5B3FE0' },
        coral:   '#FF6B8B',
        lime:    '#C5F26B',
        sky:     '#7CC7FF',
        butter:  '#FFD66B',
        mint:    '#8EE7C8',
      },
      // Ombre "neo-brutalist" del design system
      boxShadow: {
        hard:    '4px 4px 0 0 #1A1726',
        'hard-lg': '8px 8px 0 0 #1A1726',
        'hard-xl': '12px 12px 0 0 #1A1726',
      },
      borderRadius: {
        sm: '10px',
        DEFAULT: '18px',
        lg: '28px',
        xl: '36px',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'system-ui', 'sans-serif'],
        sans:    ['"DM Sans"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderWidth: {
        DEFAULT: '1px',
        2: '2px',
        3: '2.5px',
      },
    },
  },
  plugins: [],
};
