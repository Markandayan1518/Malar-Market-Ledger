import { useTranslation } from 'react-i18next';

/**
 * Arctic Frost Theme - Loading Spinner Component
 * 
 * Features:
 * - Glacier blue color option
 * - Multiple size variants
 * - Fade-in animation
 * - Optional loading text
 * - Pulse animation for text
 */
const LoadingSpinner = ({ 
  size = 'md', 
  text, 
  color = 'glacier',
  className = '' 
}) => {
  const { t } = useTranslation();

  const sizeConfig = {
    sm: {
      spinner: 'w-5 h-5 border-2',
      text: 'text-xs',
      gap: 'gap-2'
    },
    md: {
      spinner: 'w-8 h-8 border-[3px]',
      text: 'text-sm',
      gap: 'gap-3'
    },
    lg: {
      spinner: 'w-12 h-12 border-4',
      text: 'text-base',
      gap: 'gap-4'
    },
    xl: {
      spinner: 'w-16 h-16-[5px]',
      text: 'text-lg',
      gap: 'gap-4'
    }
  };

  const colorConfig = {
    glacier: {
      border: 'border-ice-border',
      borderTop: 'border-t-glacier-500',
      text: 'text-glacier-600'
    },
    aurora: {
      border: 'border-aurora-200',
      borderTop: 'border-t-aurora-500',
      text: 'text-aurora-600'
    },
    frostbite: {
      border: 'border-frostbite-200',
      borderTop: 'border-t-frostbite-500',
      text: 'text-frostbite-600'
    },
    gold: {
      border: 'border-gold-200',
      borderTop: 'border-t-gold-500',
      text: 'text-gold-600'
    },
    slate: {
      border: 'border-slate-200',
      borderTop: 'border-t-slate-500',
      text: 'text-slate-600'
    }
  };

  const config = sizeConfig[size];
  const colors = colorConfig[color];

  return (
    <div 
      className={`
        flex flex-col items-center justify-center 
        ${config.gap} 
        animate-fade-in
        ${className}
      `}
      role="status"
      aria-label={text || t('common.loading')}
      aria-live="polite"
    >
      {/* Spinner */}
      <div 
        className={`
          rounded-full 
          ${config.spinner}
          ${colors.border}
          ${colors.borderTop}
          animate-spin
        `}
        style={{
          animationTimingFunction: 'linear',
          animationDuration: '0.8s'
        }}
      />
      
      {/* Loading text */}
      {text && (
        <p className={`
          font-medium 
          ${config.text}
          ${colors.text}
          animate-pulse
        `}>
          {text}
        </p>
      )}
      
      {/* Screen reader text */}
      <span className="sr-only">
        {text || t('common.loading')}
      </span>
    </div>
  );
};

/**
 * Full Page Loading Spinner
 * Used for page-level loading states
 */
export const FullPageSpinner = ({ text, color = 'glacier' }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-arctic-ice/80 backdrop-blur-sm z-50">
      <LoadingSpinner size="xl" text={text} color={color} />
    </div>
  );
};

/**
 * Inline Loading Spinner
 * Used for inline loading states within components
 */
export const InlineSpinner = ({ size = 'sm', color = 'glacier', className = '' }) => {
  return (
    <LoadingSpinner 
      size={size} 
      color={color} 
      className={`inline-flex ${className}`} 
    />
  );
};

/**
 * Skeleton Loading Component
 * Used for content placeholder while loading
 */
export const Skeleton = ({ 
  width = 'full', 
  height = '4', 
  rounded = 'arctic',
  className = '' 
}) => {
  const widthClass = width === 'full' ? 'w-full' : `w-${width}`;
  const heightClass = `h-${height}`;
  const roundedClass = `rounded-${rounded}`;

  return (
    <div 
      className={`
        ${widthClass} ${heightClass} ${roundedClass}
        bg-arctic-frost
        animate-shimmer
        ${className}
      `}
      style={{
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animationDuration: '1.5s'
      }}
    />
  );
};

// CSS Animations
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  
  .animate-shimmer {
    animation: shimmer 1.5s infinite linear;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('loading-spinner-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'loading-spinner-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default LoadingSpinner;
