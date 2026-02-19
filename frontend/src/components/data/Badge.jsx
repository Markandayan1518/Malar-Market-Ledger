import { useTranslation } from 'react-i18next';

/**
 * Arctic Frost Theme - Badge Component
 * 
 * Features:
 * - Arctic status colors (aurora-green, frostbite-red, gold-ice, glacier-blue)
 * - Multiple size variants
 * - Icon support
 * - Pulse animation option for notifications
 * - Dot indicator variant
 */
const Badge = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md',
  icon: Icon,
  pulse = false,
  dot = false,
  removable = false,
  onRemove
}) => {
  const { t } = useTranslation();

  const sizeConfig = {
    xs: 'px-1.5 py-0.5 text-2xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const variantStyles = {
    // Success - Aurora green
    success: `
      bg-aurora-50 
      text-aurora-700 
      border border-aurora-200
    `,
    // Error/Danger - Frostbite red
    danger: `
      bg-frostbite-50 
      text-frostbite-700 
      border border-frostbite-200
    `,
    error: `
      bg-frostbite-50 
      text-frostbite-700 
      border border-frostbite-200
    `,
    // Warning - Gold ice
    warning: `
      bg-gold-50 
      text-gold-700 
      border border-gold-200
    `,
    // Info - Glacier blue
    info: `
      bg-glacier-50 
      text-glacier-700 
      border border-glacier-200
    `,
    // Neutral - Slate
    neutral: `
      bg-arctic-frost 
      text-slate-cool 
      border border-ice-border
    `,
    // Primary - Glacier darker
    primary: `
      bg-glacier-100 
      text-glacier-800 
      border border-glacier-200
    `,
    // Pending - Gold amber
    pending: `
      bg-gold-50 
      text-gold-700 
      border border-gold-200
    `,
    // Complete - Aurora
    complete: `
      bg-aurora-50 
      text-aurora-700 
      border border-aurora-200
    `
  };

  const dotColors = {
    success: 'bg-aurora-500',
    danger: 'bg-frostbite-500',
    error: 'bg-frostbite-500',
    warning: 'bg-gold-500',
    info: 'bg-glacier-500',
    neutral: 'bg-slate-400',
    primary: 'bg-glacier-600',
    pending: 'bg-gold-500',
    complete: 'bg-aurora-500'
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5
        rounded-arctic
        font-medium
        whitespace-nowrap
        ${sizeConfig[size]}
        ${variantStyles[variant]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
      role="status"
    >
      {/* Pulse dot indicator */}
      {dot && (
        <span className={`
          relative flex h-2 w-2
        `}>
          {pulse && (
            <span className={`
              absolute inline-flex h-full w-full 
              rounded-full opacity-75
              animate-ping
              ${dotColors[variant]}
            `} />
          )}
          <span className={`
            relative inline-flex rounded-full h-2 w-2
            ${dotColors[variant]}
          `} />
        </span>
      )}
      
      {/* Icon */}
      {Icon && (
        <Icon size={iconSizes[size]} className="flex-shrink-0" />
      )}
      
      {/* Content */}
      {children}
      
      {/* Remove button */}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            ml-0.5 -mr-1 
            p-0.5 
            rounded-full
            hover:bg-black/10 
            transition-colors
            focus:outline-none focus:ring-1 focus:ring-current
          "
          aria-label={t('common.remove')}
        >
          <svg 
            width={iconSizes[size]} 
            height={iconSizes[size]} 
            viewBox="0 0 16 16" 
            fill="currentColor"
          >
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      )}
    </span>
  );
};

/**
 * Status Badge - Preset badges for common statuses
 */
export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const statusConfig = {
    // Settlement statuses
    pending: { variant: 'pending', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'danger', label: 'Rejected' },
    paid: { variant: 'complete', label: 'Paid' },
    
    // Entry statuses
    draft: { variant: 'neutral', label: 'Draft' },
    submitted: { variant: 'info', label: 'Submitted' },
    confirmed: { variant: 'success', label: 'Confirmed' },
    
    // General statuses
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    suspended: { variant: 'warning', label: 'Suspended' },
    
    // Sync statuses
    synced: { variant: 'success', label: 'Synced' },
    offline: { variant: 'warning', label: 'Offline' },
    error: { variant: 'danger', label: 'Error' }
  };

  const config = statusConfig[status] || { variant: 'neutral', label: status };

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
};

/**
 * Count Badge - For notification counts
 */
export const CountBadge = ({ count, max = 99, size = 'sm', className = '' }) => {
  if (!count || count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge 
      variant="danger" 
      size={size} 
      pulse={count > 0}
      className={`min-w-[1.25rem] justify-center ${className}`}
    >
      {displayCount}
    </Badge>
  );
};

/**
 * Dot Badge - Small indicator dot
 */
export const DotBadge = ({ variant = 'neutral', pulse = false, className = '' }) => {
  const dotColors = {
    success: 'bg-aurora-500',
    danger: 'bg-frostbite-500',
    warning: 'bg-gold-500',
    info: 'bg-glacier-500',
    neutral: 'bg-slate-400'
  };

  return (
    <span className={`relative flex h-2.5 w-2.5 ${className}`}>
      {pulse && (
        <span className={`
          absolute inline-flex h-full w-full 
          rounded-full opacity-75
          animate-ping
          ${dotColors[variant]}
        `} />
      )}
      <span className={`
        relative inline-flex rounded-full h-full w-full
        ${dotColors[variant]}
      `} />
    </span>
  );
};

export default Badge;
