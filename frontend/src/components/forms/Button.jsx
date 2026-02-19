import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { Loader2 } from 'lucide-react';

/**
 * Button Component - Arctic Frost Design
 * 
 * Variants: primary, secondary, danger, success, ghost
 * Sizes: sm, md, lg
 * 
 * Features:
 * - Theme-aware styling (arctic/warm)
 * - Gradient option for primary buttons
 * - Loading state with spinner
 * - Icon support (left/right)
 * - Press animation feedback
 */
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient = false,
  ...props
}, ref) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isArctic = theme === 'arctic';

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center font-semibold rounded-arctic
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Arctic variant classes
  const arcticVariants = {
    primary: gradient
      ? 'bg-gradient-to-r from-glacier-500 to-glacier-600 hover:from-glacier-600 hover:to-glacier-700 text-white shadow-frost-sm hover:shadow-frost-md focus:ring-glacier-500'
      : 'bg-glacier-500 hover:bg-glacier-600 text-white shadow-frost-sm hover:shadow-frost-md focus:ring-glacier-500',
    secondary: 'bg-arctic-ice hover:bg-arctic-frost text-slate-charcoal border border-ice-border shadow-frost-sm hover:shadow-frost-md focus:ring-glacier-400',
    danger: 'bg-frostbite hover:bg-frostbite/90 text-white shadow-frost-sm hover:shadow-frost-md focus:ring-frostbite',
    success: 'bg-aurora hover:bg-aurora/90 text-white shadow-frost-sm hover:shadow-frost-md focus:ring-aurora',
    ghost: 'bg-transparent hover:bg-arctic-frost text-slate-charcoal focus:ring-glacier-400'
  };

  // Warm variant classes (legacy)
  const warmVariants = {
    primary: 'bg-accent-magenta hover:bg-purple-700 text-white shadow-soft hover:shadow-medium focus:ring-accent-magenta',
    secondary: 'bg-white hover:bg-warm-sand text-warm-charcoal border-2 border-warm-taupe shadow-soft hover:shadow-medium focus:ring-warm-taupe',
    danger: 'bg-accent-crimson hover:bg-red-700 text-white shadow-soft hover:shadow-medium focus:ring-accent-crimson',
    success: 'bg-accent-emerald hover:bg-emerald-600 text-white shadow-soft hover:shadow-medium focus:ring-accent-emerald',
    ghost: 'bg-transparent hover:bg-warm-sand text-warm-charcoal focus:ring-warm-taupe'
  };

  const variantClasses = isArctic ? arcticVariants : warmVariants;

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[36px]',
    md: 'px-5 py-2.5 text-base gap-2 min-h-[44px]',
    lg: 'px-6 py-3 text-lg gap-2.5 min-h-[52px]'
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'cursor-wait' : 'active:scale-[0.98]'}
    ${isArctic ? 'focus:ring-offset-arctic-ice' : 'focus:ring-offset-warm-cream'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={iconSize} />
          <span>{t('common.saving')}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={iconSize} />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon size={iconSize} />
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
