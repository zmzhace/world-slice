import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0a',
          raised: '#141414',
          overlay: '#1a1a1a',
        },
        accent: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dim: '#1E40AF',
        },
        cta: '#F97316',
        success: '#22C55E',
        danger: '#EF4444',
        muted: '#64748B',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
}

export default config
