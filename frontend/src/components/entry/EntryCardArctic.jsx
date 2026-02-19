import { useTranslation } from 'react-i18next';
import { Calendar, User, Flower, Scale, DollarSign, Edit2, Trash2, Check } from 'lucide-react';

/**
 * Arctic Frost Theme - Entry Card Component
 * 
 * Mobile/tablet card view for daily entries
 * Features:
 * - Card with subtle gray border (#EAECF0) and soft shadow
 * - Stacked layout for smaller screens
 * - Primary info (Farmer, Flower Type) prominent
 * - Secondary info (Weight, Rate, Total) in grid
 * - Adjustment tags visible
 * 
 * Uses Tailwind CSS with Arctic Frost theme colors
 */
const EntryCardArctic = ({
  entry,
  farmerName,
  flowerTypeName,
  currentRate,
  onEdit,
  onDelete,
  isSaving = false,
  isSaved = false,
  isActive = false,
  onActivate
}) => {
  const { t } = useTranslation();

  // Calculate the total based on weight and rate
  const calculateTotal = () => {
    if (!entry.weight || !currentRate) return '0.00';
    const weightNum = parseFloat(entry.weight);
    const rateNum = parseFloat(currentRate);
    if (isNaN(weightNum) || isNaN(rateNum)) return '0.00';
    
    let total = weightNum * rateNum;
    
    // Apply adjustments
    if (entry.adjustments) {
      entry.adjustments.forEach(adj => {
        if (adj === 'late') total *= 0.95;
        if (adj === 'wet') total *= 0.90;
        if (adj === 'bonus') total *= 1.05;
        if (adj === 'premium') total *= 1.10;
        if (adj === 'first_time') total *= 1.02;
      });
    }
    
    return total.toFixed(2);
  };

  // Get adjustment percentage for display
  const getAdjustmentPercentage = () => {
    if (!entry.adjustments || entry.adjustments.length === 0) return 0;
    
    let percentage = 0;
    entry.adjustments.forEach(adj => {
      if (adj === 'late') percentage -= 5;
      if (adj === 'wet') percentage -= 10;
      if (adj === 'bonus') percentage += 5;
      if (adj === 'premium') percentage += 10;
      if (adj === 'first_time') percentage += 2;
    });
    return percentage;
  };

  const adjustmentPercentage = getAdjustmentPercentage();
  const total = calculateTotal();
  const isPositiveAdjustment = adjustmentPercentage > 0;
  const isNegativeAdjustment = adjustmentPercentage < 0;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div
      onClick={onActivate}
      className={`
        relative p-4 mb-3 bg-white rounded-lg border transition-all duration-200 cursor-pointer
        ${isActive 
          ? 'border-[#3B82F6] shadow-md bg-[#ECFEFF]' 
          : 'border-[#EAECF0] shadow-sm hover:shadow-md hover:border-[#CBD5E1]'
        }
        ${isSaving ? 'opacity-70' : ''}
        ${isSaved ? 'border-[#10B981] bg-[#D1FAE5]' : ''}
      `}
      role="article"
      aria-label={`Entry by ${farmerName || 'Unknown Farmer'}`}
    >
      {/* Header Row: Date and Farmer */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#6B7280]" aria-hidden="true" />
          <span className="text-sm font-medium text-[#1F2937]">
            {formatDate(entry.date)}
          </span>
        </div>
        
        {/* Saved Indicator */}
        {isSaved && (
          <div className="flex items-center gap-1 text-[#10B981]" aria-label="Saved">
            <Check size={14} />
            <span className="text-xs font-medium">Saved</span>
          </div>
        )}
      </div>

      {/* Farmer Name */}
      <div className="flex items-center gap-2 mb-2">
        <User size={14} className="text-[#3B82F6]" aria-hidden="true" />
        <span className="text-base font-semibold text-[#1F2937]">
          {farmerName || 'Unknown Farmer'}
        </span>
      </div>

      {/* Flower Type */}
      <div className="flex items-center gap-2 mb-3">
        <Flower size={14} className="text-[#6B7280]" aria-hidden="true" />
        <span className="text-sm text-[#6B7280]">
          {flowerTypeName || t('dailyEntry.flowerType')}
        </span>
      </div>

      {/* Secondary Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-[#F1F5F9] rounded-md">
        {/* Weight */}
        <div className="flex items-center gap-2">
          <Scale size={14} className="text-[#6B7280]" aria-hidden="true" />
          <div>
            <p className="text-xs text-[#6B7280]">{t('dailyEntry.weight')}</p>
            <p className="text-sm font-semibold text-[#1F2937] tabular-nums">
              {entry.weight || '0.00'} kg
            </p>
          </div>
        </div>

        {/* Rate */}
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-[#6B7280]" aria-hidden="true" />
          <div>
            <p className="text-xs text-[#6B7280]">{t('dailyEntry.rate')}</p>
            <p className="text-sm font-semibold text-[#1F2937] tabular-nums">
              ₹{currentRate || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Adjustment Tags */}
      {entry.adjustments && entry.adjustments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entry.adjustments.map((adj) => {
            const isBonus = adj === 'bonus' || adj === 'premium' || adj === 'first_time';
            const isDeduction = adj === 'late' || adj === 'wet';
            
            const adjLabels = {
              late: { label: 'Late', percent: '-5%' },
              wet: { label: 'Wet', percent: '-10%' },
              bonus: { label: 'Bonus', percent: '+5%' },
              premium: { label: 'Premium', percent: '+10%' },
              first_time: { label: 'First', percent: '+2%' }
            };
            
            const adjInfo = adjLabels[adj] || { label: adj, percent: '' };
            
            return (
              <span
                key={adj}
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  ${isBonus 
                    ? 'bg-[#D1FAE5] text-[#10B981] border border-[#10B981]/30' 
                    : 'bg-[#FEE2E2] text-[#EF4444] border border-[#EF4444]/30'
                  }
                `}
              >
                {adjInfo.label} {adjInfo.percent}
              </span>
            );
          })}
          
          {/* Adjustment Total Badge */}
          {adjustmentPercentage !== 0 && (
            <span
              className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                ${isPositiveAdjustment 
                  ? 'bg-[#D1FAE5] text-[#10B981]' 
                  : 'bg-[#FEE2E2] text-[#EF4444]'
                }
              `}
            >
              {isPositiveAdjustment ? '+' : ''}{adjustmentPercentage}%
            </span>
          )}
        </div>
      )}

      {/* Total Amount */}
      <div className="flex items-center justify-between pt-3 border-t border-[#EAECF0]">
        <div>
          <p className="text-xs text-[#6B7280]">{t('dailyEntry.amount')}</p>
          <p 
            className={`
              text-xl font-bold tabular-nums
              ${isPositiveAdjustment ? 'text-[#10B981]' : ''}
              ${isNegativeAdjustment ? 'text-[#EF4444]' : ''}
              ${!isPositiveAdjustment && !isNegativeAdjustment ? 'text-[#1F2937]' : ''}
            `}
          >
            ₹{total}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              disabled={isSaving}
              className="flex items-center justify-center w-9 h-9 rounded-md
                text-[#6B7280] bg-[#F1F5F9] border border-[#EAECF0]
                hover:bg-[#E2E8F0] hover:border-[#CBD5E1]
                focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              aria-label={t('common.edit')}
            >
              <Edit2 size={16} />
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(entry.id)}
              disabled={isSaving || isSaved}
              className="flex items-center justify-center w-9 h-9 rounded-md
                text-[#EF4444] bg-[#FEE2E2] border border-[#EF4444]/30
                hover:bg-[#FECACA] hover:border-[#EF4444]
                focus:outline-none focus:ring-2 focus:ring-[#FECACA]
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntryCardArctic;
