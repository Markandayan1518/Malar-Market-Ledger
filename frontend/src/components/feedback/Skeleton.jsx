import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

/**
 * Skeleton Component
 * 
 * Loading placeholder with shimmer animation.
 * Arctic Frost styled with arctic colors and smooth animations.
 * 
 * Usage:
 * <Skeleton className="h-4 w-full" />
 * <Skeleton variant="circular" className="w-12 h-12" />
 * <SkeletonCard />
 */
const Skeleton = forwardRef(({
  variant = 'text',
  className,
  animation = 'shimmer',
  width,
  height,
  ...props
}, ref) => {
  const baseStyles = 'bg-arctic-100 rounded-arctic-sm';
  
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-arctic',
    rounded: 'rounded-xl'
  };

  const animations = {
    shimmer: 'animate-shimmer',
    pulse: 'animate-skeleton',
    none: ''
  };

  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        animations[animation],
        className
      )}
      style={{
        width: width,
        height: height
      }}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

/**
 * Skeleton Text - Multiple lines of text
 */
export const SkeletonText = ({ lines = 3, className, lastLineWidth = '60%' }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn(
          'h-4',
          i === lines - 1 && lastLineWidth ? `w-[${lastLineWidth}]` : 'w-full'
        )}
        style={{ 
          width: i === lines - 1 && lastLineWidth ? lastLineWidth : undefined 
        }}
      />
    ))}
  </div>
);

/**
 * Skeleton Avatar
 */
export const SkeletonAvatar = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <Skeleton
      variant="circular"
      className={cn(sizes[size], className)}
    />
  );
};

/**
 * Skeleton Button
 */
export const SkeletonButton = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  };

  return (
    <Skeleton
      variant="rounded"
      className={cn(sizes[size], className)}
    />
  );
};

/**
 * Skeleton Input
 */
export const SkeletonInput = ({ className }) => (
  <Skeleton
    variant="rounded"
    className={cn('h-11 w-full', className)}
  />
);

/**
 * Skeleton Card - Full card skeleton
 */
export const SkeletonCard = ({ className, hasHeader = true, lines = 3 }) => (
  <div className={cn(
    'bg-white rounded-2xl border border-arctic-border p-4 space-y-4',
    className
  )}>
    {hasHeader && (
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3 h-4" />
          <Skeleton variant="text" className="w-1/2 h-3" />
        </div>
      </div>
    )}
    <SkeletonText lines={lines} />
  </div>
);

/**
 * Skeleton Table Row
 */
export const SkeletonTableRow = ({ columns = 4, className }) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton variant="text" className="h-4" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton Table - Full table skeleton
 */
export const SkeletonTable = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('bg-white rounded-2xl border border-arctic-border overflow-hidden', className)}>
    <table className="min-w-full">
      <thead className="bg-arctic-ice">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <Skeleton variant="text" className="h-3 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-arctic-border">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Skeleton Stat Card
 */
export const SkeletonStatCard = ({ className }) => (
  <div className={cn(
    'bg-white rounded-xl border border-arctic-border p-4',
    className
  )}>
    <div className="flex items-center justify-between mb-3">
      <Skeleton variant="text" className="h-3 w-16" />
      <Skeleton variant="circular" className="w-8 h-8" />
    </div>
    <Skeleton variant="text" className="h-8 w-24 mb-1" />
    <Skeleton variant="text" className="h-3 w-32" />
  </div>
);

/**
 * Skeleton List Item
 */
export const SkeletonListItem = ({ className }) => (
  <div className={cn(
    'flex items-center gap-3 p-3 border-b border-arctic-border',
    className
  )}>
    <SkeletonAvatar size="md" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-1/3 h-4" />
      <Skeleton variant="text" className="w-1/2 h-3" />
    </div>
    <Skeleton variant="rounded" className="w-16 h-6" />
  </div>
);

/**
 * Skeleton Page - Full page loading state
 */
export const SkeletonPage = ({ title = true, className }) => (
  <div className={cn('min-h-screen bg-arctic-ice p-6', className)}>
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      {title && (
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton variant="text" className="h-8 w-48" />
            <Skeleton variant="text" className="h-4 w-32" />
          </div>
          <SkeletonButton />
        </div>
      )}
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      
      {/* Main Content */}
      <SkeletonTable rows={6} columns={5} />
    </div>
  </div>
);

/**
 * Skeleton Dashboard
 */
export const SkeletonDashboard = ({ className }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-8 w-64" />
        <Skeleton variant="text" className="h-4 w-48" />
      </div>
      <div className="flex gap-2">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" />
      </div>
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    
    {/* Two Column Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard lines={4} />
      <SkeletonCard lines={4} />
    </div>
    
    {/* Activity Section */}
    <div className="bg-white rounded-2xl border border-arctic-border p-4">
      <Skeleton variant="text" className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
