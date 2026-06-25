import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#12121a',
        surface2: '#1a1a28',
        border: '#2a2a3e',
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#06b6d4',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        text: '#e2e8f0',
        muted: '#64748b',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        // shadcn compatibility
        foreground: '#e2e8f0',
        card: {
          DEFAULT: '#12121a',
          foreground: '#e2e8f0',
        },
        popover: {
          DEFAULT: '#1a1a28',
          foreground: '#e2e8f0',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        input: '#2a2a3e',
        ring: '#7c3aed',
      },
      borderColor: {
        DEFAULT: '#2a2a3e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.3), transparent)',
        'card-glow': 'radial-gradient(ellipse 50% 50% at 50% 0%, rgba(124, 58, 237, 0.1), transparent)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-primary': '0 0 30px rgba(124, 58, 237, 0.4)',
        'glow-secondary': '0 0 30px rgba(6, 182, 212, 0.4)',
        'glow-accent': '0 0 30px rgba(245, 158, 11, 0.4)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [animate],
}

export default config
