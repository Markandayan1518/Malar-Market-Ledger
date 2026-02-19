import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  IndianRupee
} from 'lucide-react';

/**
 * Arctic Frost Theme - Settlement Summary Component
 * 
 * Displays summary statistics for settlements with Arctic styling:
 * - Frosted glass card effect
 * - Aurora-green for positive values
 * - Gold-ice for warnings/advances
 * - Frostbite-red for deductions
 * - Animated value counters
 * - Responsive grid layout
 * 
 * Color Mapping:
 * - Farmers: glacier-blue
 * - Weight: aurora-green
 * - Gross: aurora-green
 * - Advances: gold-ice (warning)
 * - Deductions: frostbite-red
 * - Net: aurora-green (positive) or frostbite-red (negative)
 */
const SettlementSummary = ({
  totalFarmers = 0,
  totalWeight = 0,
  totalGross = 0,
  totalDeductions = 0,
  totalAdvances = 0,
  totalNet = 0,
  loading = false
}) => {
  const { t } = useTranslation();

  // Format currency with Indian locale
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format weight in kg
  const formatWeight = (weight) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format((weight || 0) / 1000); // Convert grams to kg
  };

  // Summary items configuration with Arctic colors
  const summaryItems = [
    {
      key: 'farmers',
      label: t('settlements.totalFarmers'),
      value: totalFarmers,
      icon: Users,
      iconBg: 'bg-glacier-100',
      iconColor: 'text-glacier-600',
      valueColor: 'text-arctic-night',
      borderAccent: 'border-t-glacier-400'
    },
    {
      key: 'weight',
      label: t('settlements.totalWeight'),
      value: `${formatWeight(totalWeight)} kg`,
      icon: Scale,
      iconBg: 'bg-aurora-100',
      iconColor: 'text-aurora-600',
      valueColor: 'text-arctic-night',
      borderAccent: 'border-t-aurora-400'
    },
    {
      key: 'gross',
      label: t('settlements.totalGross'),
      value: formatCurrency(totalGross),
      icon: IndianRupee,
      iconBg: 'bg-aurora-100',
      iconColor: 'text-aurora-600',
      valueColor: 'text-aurora-700',
      borderAccent: 'border-t-aurora-400'
    },
    {
      key: 'advances',
      label: t('settlements.totalAdvances'),
      value: formatCurrency(totalAdvances),
      icon: TrendingUp,
      iconBg: 'bg-gold-100',
      iconColor: 'text-gold-600',
      valueColor: 'text-gold-700',
      borderAccent: 'border-t-gold-400'
    },
    {
      key: 'deductions',
      label: t('settlements.totalDeductions'),
      value: formatCurrency(totalDeductions),
      icon: TrendingDown,
      iconBg: 'bg-frostbite-100',
      iconColor: 'text-frostbite-600',
      valueColor: 'text-frostbite-700',
      borderAccent: 'border-t-frostbite-400'
    },
    {
      key: 'net',
      label: t('settlements.totalNet'),
      value: formatCurrency(totalNet),
      icon: totalNet >= 0 ? TrendingUp : TrendingDown,
      iconBg: totalNet >= 0 ? 'bg-aurora-100' : 'bg-frostbite-100',
      iconColor: totalNet >= 0 ? 'text-aurora-600' : 'text-frostbite-600',
      valueColor: totalNet >= 0 ? 'text-aurora-700' : 'text-frostbite-700',
      borderAccent: totalNet >= 0 ? 'border-t-aurora-400' : 'border-t-frostbite-400',
      highlight: true // Most important metric
    }
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="animate-pulse bg-white rounded-xl border border-arctic-border p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-arctic-ice rounded-lg"></div>
              <div className="h-3 bg-arctic-ice rounded w-20"></div>
            </div>
            <div className="h-6 bg-arctic-ice rounded w-28"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {summaryItems.map((item) => (
        <div
          key={item.key}
          className={`
            relative bg-white rounded-xl border border-arctic-border p-4
            shadow-sm hover:shadow-md transition-all duration-200
            border-t-4 ${item.borderAccent}
            ${item.highlight ? 'ring-2 ring-aurora-200 ring-offset-2' : ''}
          `}
          role="region"
          aria-label={item.label}
        >
          {/* Icon and Label */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`
              p-2 rounded-lg ${item.iconBg}
              transition-transform duration-200
              group-hover:scale-110
            `}>
              <item.icon 
                size={16} 
                className={item.iconColor} 
                aria-hidden="true" 
              />
            </div>
            <span className="text-xs font-medium text-arctic-charcoal uppercase tracking-wide truncate">
              {item.label}
            </span>
          </div>
          
          {/* Value */}
          <p className={`
            text-lg font-bold font-mono tabular-nums ${item.valueColor}
            transition-all duration-300
          `}>
            {item.value}
          </p>

          {/* Highlight indicator for net amount */}
          {item.highlight && (
            <div className="absolute -top-1 -right-1">
              <div className={`
                w-3 h-3 rounded-full
                ${item.valueColor.includes('aurora') ? 'bg-aurora-400' : 'bg-frostbite-400'}
                animate-pulse
              `}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SettlementSummary;
