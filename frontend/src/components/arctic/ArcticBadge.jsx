/**
 * ArcticBadge - Badge component for Arctic Frost theme
 * 
 * Status variants: success, warning, error, info, neutral
 * Size variants: sm, md, lg
 * 
 * Features:
 * - Icon support
 * - Pulse animation option
 * - Dot indicator option
 */
const ArcticBadge = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  pulse = false,
  dot = false,
  className = '',
  ...props
}) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold
    rounded-full
    transition-all duration-200
  `;

  // Size styles
  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  // Icon-only sizes
  const iconSizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  // Variant styles
  const variants = {
    success: `
      bg-aurora/10 text-aurora
      border border-aurora/20
    `,
    warning: `
      bg-gold/10 text-gold
      border border-gold/20
    `,
    error: `
      bg-frostbite/10 text-frostbite
      border border-frostbite/20
    `,
    info: `
      bg-glacier-500/10 text-glacier-600
      border border-glacier-500/20
    `,
    neutral: `
      bg-slate-mist/10 text-slate-cool
      border border-slate-mist/20
    `,
  };

  // Check if icon-only badge
  const isIconOnly = Icon && !children;

  // Pulse animation
  const pulseStyles = pulse
    ? 'animate-pulse'
    : '';

  // Dot indicator
  const renderDot = () => {
    if (!dot) return null;
    const dotColors = {
      success: 'bg-aurora',
      warning: 'bg-gold',
      error: 'bg-frostbite',
      info: 'bg-glacier-500',
      neutral: 'bg-slate-mist',
    };
    return (
      <span
        className={`
          w-1.5 h-1.5 rounded-full
          ${dotColors[variant]}
          ${pulse ? 'animate-ping' : ''}
        `.replace(/\s+/g, ' ').trim()}
      />
    );
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${isIconOnly ? iconSizes[size] : sizes[size]}
        ${variants[variant]}
        ${pulseStyles}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {dot && renderDot()}
      {Icon && <Icon className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />}
      {children}
    </span>
  );
};

// Status-specific badge presets
ArcticBadge.Success = function ArcticBadgeSuccess(props) {
  return <ArcticBadge variant="success" {...props} />;
};

ArcticBadge.Warning = function ArcticBadgeWarning(props) {
  return <ArcticBadge variant="warning" {...props} />;
};

ArcticBadge.Error = function ArcticBadgeError(props) {
  return <ArcticBadge variant="error" {...props} />;
};

ArcticBadge.Info = function ArcticBadgeInfo(props) {
  return <ArcticBadge variant="info" {...props} />;
};

// Status dot indicator (minimal)
ArcticBadge.StatusDot = function ArcticBadgeStatusDot({
  status = 'neutral',
  pulse = false,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const colors = {
    success: 'bg-aurora',
    warning: 'bg-gold',
    error: 'bg-frostbite',
    info: 'bg-glacier-500',
    neutral: 'bg-slate-mist',
  };

  return (
    <span
      className={`
        inline-block rounded-full
        ${sizes[size]}
        ${colors[status]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    />
  );
};

export default ArcticBadge;
