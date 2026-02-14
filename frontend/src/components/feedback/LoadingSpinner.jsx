const LoadingSpinner = ({ size = 'md', text, className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
    xl: 'w-20 h-20 border-5'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`} role="status" aria-label="Loading" />
      {text && (
        <p className="text-sm font-medium text-warm-brown animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
