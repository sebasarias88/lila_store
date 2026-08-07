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
        'bg-base': '#F9F6FF',
        'bg-surface': '#FFFFFF',
        'bg-muted': '#F0EAFB',
        'accent-primary': '#A989E0',
        'accent-primary-hover': '#9472D4',
        'accent-secondary': '#E8A0C8',
        'accent-deep': '#6E4FA8',
        'text-primary': '#2A2240',
        'text-muted': '#6B6080',
        border: '#E6DCF5',
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
        soft: '0 8px 24px -8px rgba(169, 137, 224, 0.28)',
      },
    },
  },
  plugins: [],
}

export default config
