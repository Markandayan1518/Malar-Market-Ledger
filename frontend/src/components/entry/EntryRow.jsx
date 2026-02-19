import { useState, useRef, forwardRef } from 'react';
import { Check, Trash2 } from 'lucide-react';

/**
 * Arctic Frost Theme - Entry Row Component
 * 
 * Features:
 * - Spotlight on Ice effect when active
 * - Flash freeze animation on save
 * - High-contrast financial display
 * - Large touch targets for gloved hands
 */
const EntryRow = forwardRef(({
  entry,
  farmers,
  currentRate,
  onUpdate,
  onDelete,
  isSaved = false,
  isSaving = false,
  isNew = false,
  isActive = false,
  onActivate,
  onDeactivate
}, ref) => {
  const [farmerId, setFarmerId] = useState(entry.farmerId || '');
  const [weight, setWeight] = useState(entry.weight || '');
  const [adjustments, setAdjustments] = useState(entry.adjustments || []);
  const [showSaved, setShowSaved] = useState(false);

  const farmerRef = useRef(null);
  const weightRef = useRef(null);

  const selectedFarmer = farmers.find(f => f.id === farmerId);

  const calculateTotal = () => {
    if (!weight || !currentRate) return 0;
    const weightNum = parseFloat(weight);
    const rateNum = parseFloat(currentRate);
    if (isNaN(weightNum) || isNaN(rateNum)) return 0;
    
    let total = weightNum * rateNum;
    
    adjustments.forEach(adj => {
      if (adj === 'late') total *= 0.95;
      if (adj === 'wet') total *= 0.90;
      if (adj === 'bonus') total *= 1.05;
      if (adj === 'premium') total *= 1.10;
      if (adj === 'first_time') total *= 1.02;
    });
    
    return total.toFixed(2);
  };

  const total = calculateTotal();

  // Flash freeze animation trigger
  const justSaved = isSaved && !showSaved;
  
  if (justSaved && !showSaved) {
    setTimeout(() => setShowSaved(true), 600);
  }

  const handleSave = () => {
    if (!farmerId || !weight) return;
    
    onUpdate({
      ...entry,
      farmerId,
      weight: parseFloat(weight),
      adjustments,
      total: parseFloat(calculateTotal())
    });
  };

  const handleDelete = () => {
    if (onDelete && !isNew) {
      onDelete(entry.id);
    }
  };

  const handleKeyDown = (e, nextFieldRef) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      nextFieldRef?.current?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleRowFocus = () => {
    onActivate?.();
  };

  const handleRowBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      onDeactivate?.();
    }
  };

  // Calculate adjustment percentage for display
  const getAdjustmentPercentage = (adjustments) => {
    let percentage = 0;
    adjustments.forEach(adj => {
      if (adj === 'late') percentage -= 5;
      if (adj === 'wet') percentage -= 10;
      if (adj === 'bonus') percentage += 5;
      if (adj === 'premium') percentage += 10;
      if (adj === 'first_time') percentage += 2;
    });
    return percentage;
  };

  const adjustmentPercentage = getAdjustmentPercentage(adjustments);

  return (
    <tr 
      ref={ref}
      className={`
        border-b border-ice-border
        transition-all duration-200
        ${isActive ? 'arctic-row-active' : 'bg-arctic-ice even:bg-arctic-snow/50'}
        ${isSaving || justSaved ? 'animate-flash-freeze' : ''}
        ${showSaved ? 'bg-aurora-light/20' : ''}
      `}
      onFocus={handleRowFocus}
      onBlur={handleRowBlur}
      tabIndex={-1}
      style={isActive ? {
        boxShadow: '0 0 0 2px #3B82F6, 0 4px 12px rgba(59, 130, 246, 0.15)',
        transform: 'scale(1.001)',
        position: 'relative',
        zIndex: 5
      } : {}}
    >
      {/* Farmer Cell */}
      <td className="px-4 py-4">
        <input
          ref={farmerRef}
          type="text"
          value={selectedFarmer?.name || ''}
          onChange={(e) => setFarmerId(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, weightRef)}
          disabled={isSaving}
          placeholder="Select farmer"
          className="entry-cell"
          readOnly={!isNew}
        />
      </td>

      {/* Weight Cell (Hero - 20% larger, bolder) */}
      <td className="px-4 py-4">
        <input
          ref={weightRef}
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, null)}
          disabled={isSaving}
          placeholder="0.00"
          className="entry-cell font-mono text-lg font-bold text-right text-slate-charcoal"
        />
      </td>

      {/* Adjustments Cell */}
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { key: 'late', label: 'Late', type: 'deduction' },
            { key: 'wet', label: 'Wet', type: 'deduction' },
            { key: 'bonus', label: 'Bonus', type: 'bonus' },
            { key: 'premium', label: 'Premium', type: 'bonus' },
          ].map(adj => {
            const isSelected = adjustments.includes(adj.key);
            return (
              <button
                key={adj.key}
                type="button"
                onClick={() => {
                  if (isSaving) return;
                  if (isSelected) {
                    setAdjustments(adjustments.filter(a => a !== adj.key));
                  } else {
                    setAdjustments([...adjustments, adj.key]);
                  }
                }}
                disabled={isSaving}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                  min-h-[32px]
                  ${isSelected 
                    ? adj.type === 'deduction' 
                      ? 'bg-frostbite-light text-frostbite border border-frostbite-medium' 
                      : 'bg-aurora-light text-aurora-dark border border-aurora-medium'
                    : 'bg-arctic-frost text-slate-cool border border-ice-border hover:border-ice-border-dark'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                `}
              >
                {adj.label}
              </button>
            );
          })}
          
          {/* Adjustment Total Badge */}
          {adjustmentPercentage !== 0 && (
            <span 
              className={`
                px-2 py-1 rounded text-xs font-bold ml-1
                ${adjustmentPercentage > 0 
                  ? 'bg-aurora-light text-aurora-dark' 
                  : 'bg-frostbite-light text-frostbite'
                }
              `}
            >
              {adjustmentPercentage > 0 ? '+' : ''}{adjustmentPercentage}%
            </span>
          )}
        </div>
      </td>

      {/* Rate Cell */}
      <td className="px-4 py-4 text-right">
        <span className="font-mono text-sm text-slate-cool">
          ₹{currentRate?.toFixed(2) || '0.00'}
        </span>
      </td>

      {/* Total Cell (Hero - 20% larger, bolder) */}
      <td className="px-4 py-4 text-right">
        <span 
          className={`
            font-mono text-lg font-bold
            ${adjustmentPercentage > 0 ? 'text-aurora-dark' : ''}
            ${adjustmentPercentage < 0 ? 'text-frostbite' : ''}
            ${adjustmentPercentage === 0 ? 'text-slate-charcoal' : ''}
          `}
        >
          ₹{total}
        </span>
      </td>

      {/* Actions Cell */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          {/* Saved Checkmark - Flash Freeze Animation */}
          {showSaved && (
            <div className="animate-checkmark-appear text-aurora">
              <Check size={20} strokeWidth={2.5} />
            </div>
          )}
          
          {/* Delete Button - Large touch target */}
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={isSaving || isSaved}
              className="
                w-9 h-9 flex items-center justify-center rounded-lg
                text-slate-cool hover:text-frostbite hover:bg-frostbite-light
                transition-all duration-150 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
              "
              aria-label="Delete entry"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

EntryRow.displayName = 'EntryRow';

export default EntryRow;
