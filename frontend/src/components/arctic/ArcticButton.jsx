import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ArcticButton - Primary button component for Arctic Frost theme
 * 
 * Variants:
 * - primary: Gradient blue button for main actions
 * - secondary: Outlined button for secondary actions
 * - ghost: Transparent button for subtle actions
 * - danger: Red button for destructive actions
 * 
 * Sizes:
 * - sm: Small buttons for compact UIs
 * - md: Default size
 * - lg: Large buttons for prominent actions
 */
const ArcticButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-arctic
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-glacier-500 focus:ring-offset-2 focus:ring-offset-arctic-snow
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:scale-[1.02] active:scale-95 disabled:active:scale-100 disabled:hover:scale-100
  `;

  // Variant styles
  const variants = {
    primary: `
      bg-gradient-to-r from-glacier-500 to-glacier-600
      hover:from-glacier-600 hover:to-glacier-700
      text-white
      shadow-arctic-btn hover:shadow-arctic-btn-hover
    `,
    secondary: `
      bg-arctic-ice hover:bg-arctic-frost
      text-slate-deep
      border border-ice-border
      shadow-arctic-sm hover:shadow-arctic-md
    `,
    ghost: `
      bg-transparent hover:bg-arctic-frost
      text-slate-deep
    `,
    danger: `
      bg-frostbite hover:bg-frostbite-dark
      text-white
      shadow-arctic-sm hover:shadow-arctic-md
    `,
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-5 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={iconSizes[size]} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSizes[size]} />
      )}
    </button>
  );
});

ArcticButton.displayName = 'ArcticButton';

export default ArcticButton;
