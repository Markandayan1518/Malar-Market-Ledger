/**
 * ArcticCard - Card component for Arctic Frost theme
 * 
 * Variants:
 * - basic: Simple card with border
 * - elevated: Card with shadow
 * - interactive: Card with hover effects
 * 
 * Features:
 * - Frosted glass option
 * - Header/body/footer sections
 * - Loading skeleton
 */
const ArcticCard = ({
  children,
  variant = 'elevated',
  frosted = false,
  className = '',
  header,
  footer,
  onClick,
  as: Component = 'div',
  ...props
}) => {
  // Base styles
  const baseStyles = `
    rounded-arctic-lg
    border
    transition-all duration-200
  `;

  // Variant styles
  const variants = {
    basic: `
      bg-arctic-ice
      border-ice-border
    `,
    elevated: `
      bg-arctic-ice
      border-ice-border
      shadow-arctic-md
    `,
    interactive: `
      bg-arctic-ice
      border-ice-border
      shadow-arctic-md
      hover:shadow-arctic-lg hover:border-glacier-500/30
      cursor-pointer
      active:scale-[0.99]
    `,
  };

  // Frosted glass effect
  const frostedStyles = frosted
    ? `
        bg-arctic-ice/80
        backdrop-blur-md
        border-arctic-mist
      `
    : '';

  const isInteractive = variant === 'interactive' || onClick;

  return (
    <Component
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${frostedStyles}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...(isInteractive && {
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e);
          }
        },
      })}
      {...props}
    >
      {header && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border">
          {header}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-ice-border bg-arctic-frost/50 rounded-b-arctic-lg">
          {footer}
        </div>
      )}
    </Component>
  );
};

// Card Header subcomponent
ArcticCard.Header = function ArcticCardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 border-b border-ice-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title subcomponent
ArcticCard.Title = function ArcticCardTitle({ children, className = '', ...props }) {
  return (
    <h3
      className={`font-display text-xl font-semibold text-slate-charcoal ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

// Card Body subcomponent
ArcticCard.Body = function ArcticCardBody({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Footer subcomponent
ArcticCard.Footer = function ArcticCardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 border-t border-ice-border bg-arctic-frost/50 rounded-b-arctic-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Loading Skeleton subcomponent
ArcticCard.Skeleton = function ArcticCardSkeleton({ className = '' }) {
  return (
    <div
      className={`
        rounded-arctic-lg border border-ice-border bg-arctic-ice
        animate-pulse
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      <div className="p-6 space-y-4">
        <div className="h-4 bg-arctic-frost rounded w-3/4" />
        <div className="h-4 bg-arctic-frost rounded w-1/2" />
        <div className="h-4 bg-arctic-frost rounded w-5/6" />
      </div>
    </div>
  );
};

export default ArcticCard;
