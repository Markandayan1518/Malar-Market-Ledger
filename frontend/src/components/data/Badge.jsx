const Badge = ({
  variant = 'neutral',
  children,
  className = '',
  size = 'md',
  icon: Icon
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral'
  };

  return (
    <span className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} className="mr-1.5" />}
      {children}
    </span>
  );
};

export default Badge;
