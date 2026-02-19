import { useTranslation } from 'react-i18next';

/**
 * Arctic Frost Theme - Card Component
 * 
 * Features:
 * - Arctic background and borders
 * - Hover elevation effect
 * - Card header with actions
 * - Loading skeleton state
 * - Multiple variants
 */
const CardBase = ({
  title,
  subtitle,
  children,
  actions,
  className = '',
  hoverable = false,
  interactive = false,
  loading = false,
  variant = 'basic',
  onClick
}) => {
  const { t } = useTranslation();

  const variantStyles = {
    basic: 'bg-arctic-ice border-ice-border',
    elevated: 'bg-arctic-ice border-ice-border shadow-arctic-md',
    interactive: 'bg-arctic-ice border-ice-border hover:shadow-arctic-lg hover:border-glacier-300',
    frosted: 'bg-arctic-ice/80 border-ice-border backdrop-blur-md'
  };

  const baseClasses = `
    rounded-arctic-lg
    border
    transition-all duration-200
    ${variantStyles[variant]}
    ${hoverable ? 'hover:shadow-arctic-lg hover:border-glacier-300 cursor-pointer' : ''}
    ${interactive ? 'hover:shadow-arctic-lg hover:border-glacier-300 hover:-translate-y-0.5 cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
  `;

  // Loading skeleton state
  if (loading) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="p-5 space-y-4">
          {/* Title skeleton */}
          <div className="h-5 w-1/3 bg-arctic-frost rounded-arctic animate-pulse" />
          {/* Content skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-full bg-arctic-frost rounded-arctic animate-pulse" />
            <div className="h-4 w-4/5 bg-arctic-frost rounded-arctic animate-pulse" />
            <div className="h-4 w-2/3 bg-arctic-frost rounded-arctic animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {(title || actions) && (
        <div className="
          flex items-center justify-between 
          px-5 py-4 
          border-b border-ice-border
          bg-arctic-snow/30
          rounded-t-arctic-lg
        ">
          <div className="min-w-0">
            {title && (
              <h3 className="
                text-base font-semibold 
                text-slate-charcoal 
                font-display tracking-tight
                truncate
              ">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-cool mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

/**
 * Card Header Component
 */
const CardHeader = ({ children, className = '', action }) => (
  <div className={`
    flex items-center justify-between
    px-5 py-4 
    border-b border-ice-border
    bg-arctic-snow/30
    rounded-t-arctic-lg
    ${className}
  `}>
    <div className="min-w-0">
      {children}
    </div>
    {action && (
      <div className="ml-4 flex-shrink-0">
        {action}
      </div>
    )}
  </div>
);

/**
 * Card Body Component
 */
const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

/**
 * Card Footer Component
 */
const CardFooter = ({ children, className = '' }) => (
  <div className={`
    px-5 py-4 
    border-t border-ice-border
    bg-arctic-snow/20
    rounded-b-arctic-lg
    ${className}
  `}>
    {children}
  </div>
);

/**
 * Stat Card Component
 * Quick stat display with icon
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  className = ''
}) => {
  const trendColors = {
    up: 'text-aurora-600 bg-aurora-50',
    down: 'text-frostbite-600 bg-frostbite-50',
    neutral: 'text-slate-cool bg-arctic-frost'
  };

  return (
    <div className={`
      bg-arctic-ice 
      border border-ice-border 
      rounded-arctic-lg 
      p-5
      hover:shadow-arctic-md 
      transition-all duration-200
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-cool mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-charcoal font-display tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-cool mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className="
            p-3 
            bg-glacier-50 
            rounded-arctic
            text-glacier-600
          ">
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div className={`
          inline-flex items-center gap-1 
          mt-3 px-2 py-1 
          rounded-arctic-sm 
          text-xs font-medium
          ${trendColors[trendDirection]}
        `}>
          {trendDirection === 'up' && '↑'}
          {trendDirection === 'down' && '↓'}
          {trend}
        </div>
      )}
    </div>
  );
};

// Compose Card with sub-components
const Card = Object.assign(CardBase, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Stat: StatCard
});

export default Card;
