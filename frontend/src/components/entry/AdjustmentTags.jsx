import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';

const AdjustmentTags = ({ adjustments, onChange, disabled = false }) => {
  const { t } = useTranslation();

  const availableAdjustments = [
    { id: 'late', label: 'Late', color: 'text-accent-crimson' },
    { id: 'wet', label: 'Wet', color: 'text-blue-600' },
    { id: 'bonus', label: 'Bonus', color: 'text-accent-emerald' },
    { id: 'premium', label: 'Premium', color: 'text-accent-purple' },
    { id: 'first_time', label: 'First Time', color: 'text-accent-amber' }
  ];

  const toggleAdjustment = (adjustmentId) => {
    if (adjustments.includes(adjustmentId)) {
      onChange(adjustments.filter(id => id !== adjustmentId));
    } else {
      onChange([...adjustments, adjustmentId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableAdjustments.map((adjustment) => {
        const isSelected = adjustments.includes(adjustment.id);
        
        return (
          <button
            key={adjustment.id}
            type="button"
            onClick={() => toggleAdjustment(adjustment.id)}
            disabled={disabled}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200 border-2
              ${isSelected 
                ? `${adjustment.color} bg-white border-current shadow-sm` 
                : 'text-warm-brown border-warm-taupe hover:border-warm-brown hover:bg-warm-sand'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-pressed={isSelected}
          >
            {isSelected ? (
              <X size={14} />
            ) : (
              <Plus size={14} />
            )}
            <span>{adjustment.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AdjustmentTags;
