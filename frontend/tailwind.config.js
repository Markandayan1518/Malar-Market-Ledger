/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // ARCTIC FROST THEME - Primary Color Palette
        // ============================================
        
        // Backgrounds (The Frozen Surface)
        arctic: {
          snow: '#F8FAFC',
          ice: '#FFFFFF',
          frost: '#F1F5F9',
          mist: '#E2E8F0',
          glow: '#DBEAFE',
          deep: '#1E40AF',
          sky: '#0EA5E9',
          cyan: '#ECFEFF',
          border: '#EAECF0',
        },
        
        // Blues (The Cool Blues)
        glacier: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        
        // Text Colors (Typography Ice)
        slate: {
          deep: '#1E293B',
          cool: '#64748B',
          mist: '#94A3B8',
          charcoal: '#0F172A',
        },
        
        // Financial Colors (Money Spectrum)
        frostbite: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          medium: '#FECACA',
          dark: '#B91C1C',
        },
        
        aurora: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          medium: '#A7F3D0',
          dark: '#059669',
        },
        
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          medium: '#FCD34D',
        },
        
        // Border Colors
        ice: {
          border: '#E2E8F0',
          'border-dark': '#CBD5E1',
          'border-active': '#3B82F6',
        },
        
        // Legacy colors (kept for backward compatibility)
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        accent: {
          purple: '#9333EA',
          magenta: '#C026D3',
          emerald: '#10B981',
          crimson: '#DC2626',
          amber: '#F59E0B',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        // Warm palette for @apply usage
        'warm-cream': '#F5F1EB',
        'warm-sand': '#E8E0D5',
        'warm-taupe': '#D4C8BC',
        'warm-brown': '#A89888',
        'warm-charcoal': '#3D3A36',
        'warm-black': '#2A2825',
      },
      fontFamily: {
        // Arctic Theme Typography - Distinctive Fonts
        display: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
        tamil: ['Noto Sans Tamil', 'sans-serif'],
        
        // Legacy alias for backward compatibility
        arctic: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        // Arctic Shadows
        'arctic-sm': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'arctic-md': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'arctic-lg': '0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'arctic-xl': '0 10px 15px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.02)',
        'arctic-glow': '0 0 0 2px #3B82F6, 0 4px 12px rgba(59, 130, 246, 0.15)',
        'arctic-focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        'arctic-btn': '0 2px 4px rgba(59, 130, 246, 0.25), 0 4px 8px rgba(59, 130, 246, 0.1)',
        'arctic-btn-hover': '0 4px 8px rgba(59, 130, 246, 0.3), 0 8px 16px rgba(59, 130, 246, 0.15)',
        // Legacy shadows
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'arctic': '12px',
        'arctic-lg': '16px',
        'arctic-xl': '20px',
        'arctic-pill': '50px',
      },
      animation: {
        // Arctic animations
        'flash-freeze': 'flashFreeze 0.6s ease-out',
        'checkmark-appear': 'checkmarkAppear 0.3s ease-out 0.3s both',
        'focus-pulse': 'focusPulse 2s ease-in-out infinite',
        'row-lift': 'rowLift 0.2s ease-out',
        // Legacy animations
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        // Arctic keyframes
        flashFreeze: {
          '0%': { background: '#FFFFFF' },
          '30%': { background: '#DBEAFE', boxShadow: '0 0 0 2px #3B82F6' },
          '100%': { background: '#FFFFFF', boxShadow: 'none' },
        },
        checkmarkAppear: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        focusPulse: {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' },
          '50%': { boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)' },
        },
        rowLift: {
          '0%': { transform: 'scale(1)', boxShadow: 'none' },
          '100%': { transform: 'scale(1.002)', boxShadow: '0 0 0 2px #3B82F6, 0 4px 12px rgba(59, 130, 246, 0.15)' },
        },
        // Legacy keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss')],
}
