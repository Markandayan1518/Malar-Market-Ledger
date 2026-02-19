import { useTranslation } from 'react-i18next';

// Tag type configurations with Arctic Frost theme colors
const TAG_TYPES = {
  deduction: { 
    color: 'bg-frostbite-light text-frostbite-dark border-frostbite-medium', 
    icon: '−',
    ringColor: 'ring-frostbite-default'
  },
  bonus: { 
    color: 'bg-aurora-light text-aurora-dark border-aurora-medium', 
    icon: '+',
    ringColor: 'ring-aurora-default'
  },
  correction: { 
    color: 'bg-glacier-100 text-glacier-700 border-glacier-200', 
    icon: '↻',
    ringColor: 'ring-glacier-500'
  },
  quality: { 
    color: 'bg-gold-light text-gold-dark border-gold-medium', 
    icon: '★',
    ringColor: 'ring-gold-default'
  }
};

// Default adjustment presets for manual adjustments (previously handwritten scribbles)
const DEFAULT_ADJUSTMENT_PRESETS = [
  { id: 'quality-deduction', label: '-5%', type: 'deduction', value: -5 },
  { id: 'late-deduction', label: '-10%', type: 'deduction', value: -10 },
  { id: 'quality-bonus', label: '+5%', type: 'bonus', value: 5 },
  { id: 'freshness-bonus', label: '+2%', type: 'bonus', value: 2 },
  { id: 'weight-correction', label: 'Weight Fix', type: 'correction' },
  { id: 'quality-premium', label: 'Premium', type: 'quality' }
];

// Size configurations
const SIZE_CONFIG = {
  sm: {
    container: 'gap-1.5',
    tag: 'text-xs px-2 py-0.5',
    icon: 'text-xs'
  },
  md: {
    container: 'gap-2',
    tag: 'text-sm px-2.5 py-1',
    icon: 'text-sm'
  },
  lg: {
    container: 'gap-2.5',
    tag: 'text-base px-3 py-1.5',
    icon: 'text-base'
  }
};

/**
 * AdjustmentTags Component
 * 
 * Transforms manual adjustment entries into clean, clickable tag UI elements.
 * Supports multi-select with visual feedback and keyboard accessibility.
 * 
 * @param {string[]} selectedAdjustments - Array of selected adjustment IDs
 * @param {(ids: string[]) => void} onAdjustmentChange - Callback when selections change
 * @param {Array} presets - Custom adjustment presets (optional)
 * @param {'sm'|'md'|'lg'} size - Component size
 * @param {boolean} disabled - Disable all interactions
 * @param {boolean} readOnly - Display only, no interaction
 * @param {number} maxSelections - Limit number of selections
 */
const AdjustmentTags = ({
  selectedAdjustments = [],
  onAdjustmentChange,
  presets = DEFAULT_ADJUSTMENT_PRESETS,
  size = 'md',
  disabled = false,
  readOnly = false,
  maxSelections
}) => {
  const { t } = useTranslation();
  
  const sizeStyles = SIZE_CONFIG[size];
  const isInteractive = !disabled && !readOnly;

  const handleToggle = (adjustmentId) => {
    if (!isInteractive) return;
    
    // Check max selections limit
    if (maxSelections && selectedAdjustments.length >= maxSelections && !selectedAdjustments.includes(adjustmentId)) {
      return;
    }

    let newSelections;
    if (selectedAdjustments.includes(adjustmentId)) {
      newSelections = selectedAdjustments.filter(id => id !== adjustmentId);
    } else {
      newSelections = [...selectedAdjustments, adjustmentId];
    }
    
    onAdjustmentChange?.(newSelections);
  };

  const handleKeyDown = (e, adjustmentId) => {
    if (!isInteractive) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(adjustmentId);
    }
  };

  const getTagStyle = (type, isSelected) => {
    const tagType = TAG_TYPES[type] || TAG_TYPES.correction;
    return {
      base: `${sizeStyles.tag} rounded-lg font-medium border-2 transition-all duration-200`,
      default: `bg-white text-slate-cool border-arctic-mist hover:border-glacier-400 hover:bg-arctic-frost`,
      selected: `${tagType.color} border-current shadow-sm`,
      disabled: 'opacity-50 cursor-not-allowed',
      interactive: 'cursor-pointer hover:shadow-arctic-sm active:scale-95 hover:scale-105'
    };
  };

  return (
    <div 
      role="group" 
      aria-label={t('adjustments.title', 'Adjustment tags')}
      className={`flex flex-wrap ${sizeStyles.container}`}
    >
      {presets.map((preset) => {
        const isSelected = selectedAdjustments.includes(preset.id);
        const tagType = TAG_TYPES[preset.type] || TAG_TYPES.correction;
        const styles = getTagStyle(preset.type, isSelected);
        
        return (
          <button
            key={preset.id}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            aria-disabled={!isInteractive}
            onClick={() => handleToggle(preset.id)}
            onKeyDown={(e) => handleKeyDown(e, preset.id)}
            disabled={!isInteractive}
            tabIndex={isInteractive ? 0 : -1}
            className={`
              ${styles.base}
              ${isSelected ? styles.selected : styles.default}
              ${!isInteractive ? styles.disabled : styles.interactive}
              ${isSelected ? `ring-2 ring-offset-1 ${tagType.ringColor}` : ''}
              focus:outline-none focus:ring-2 focus:ring-arctic-glow focus:ring-offset-1
            `}
          >
            <span className={`inline-flex items-center ${sizeStyles.icon} mr-1`}>
              {tagType.icon}
            </span>
            <span>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// PropTypes for documentation (can be used with TypeScript in .tsx files)
/*
AdjustmentTags.propTypes = {
  selectedAdjustments: PropTypes.arrayOf(PropTypes.string),
  onAdjustmentChange: PropTypes.func.isRequired,
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['deduction', 'bonus', 'correction', 'quality']).isRequired,
      value: PropTypes.number
    })
  ),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  maxSelections: PropTypes.number
};
*/

export default AdjustmentTags;

// Export tag types for external use
export { TAG_TYPES, DEFAULT_ADJUSTMENT_PRESETS, SIZE_CONFIG };
