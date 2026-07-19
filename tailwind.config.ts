import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#FFF7FA',
        'bg-surface': '#FFFFFF',
        'bg-muted': '#FCEEF5',
        'accent-primary': '#E888B5',
        'accent-primary-hover': '#D66FA0',
        'accent-secondary': '#B79CE8',
        'accent-deep': '#9C4B7C',
        'text-primary': '#2A1F2E',
        'text-muted': '#6F5C74',
        border: '#F3D9E8',
        success: '#8FD9B6',
        warning: '#F4C77A',
        danger: '#E8798A',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'sans-serif'],
        display: ['var(--font-baloo-2)', 'sans-serif'],
      },
      borderRadius: {
        sm: '12px',
        md: '20px',
        lg: '28px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 8px 24px -8px rgba(232, 136, 181, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
