import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

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
  ...props
}, ref) => {
  const { t } = useTranslation();

  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variantClasses = {
    primary: 'bg-accent-magenta hover:bg-purple-700 text-white shadow-soft hover:shadow-medium focus:ring-accent-magenta focus:ring-offset-warm-cream',
    secondary: 'bg-white hover:bg-warm-sand text-warm-charcoal border-2 border-warm-taupe shadow-soft hover:shadow-medium focus:ring-warm-taupe focus:ring-offset-warm-cream',
    danger: 'bg-accent-crimson hover:bg-red-700 text-white shadow-soft hover:shadow-medium focus:ring-accent-crimson focus:ring-offset-warm-cream',
    success: 'bg-accent-emerald hover:bg-emerald-600 text-white shadow-soft hover:shadow-medium focus:ring-accent-emerald focus:ring-offset-warm-cream',
    ghost: 'bg-transparent hover:bg-warm-sand text-warm-charcoal focus:ring-warm-taupe focus:ring-offset-warm-cream'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'opacity-75 cursor-wait' : 'active:scale-95'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

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
          <Loader2 className="animate-spin mr-2" size={size === 'sm' ? 16 : 20} />
          <span>{t('common.saving')}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'sm' ? 16 : 20} className="mr-2" />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'sm' ? 16 : 20} className="ml-2" />
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
