import { useState, useRef, forwardRef } from 'react';
import { Check, Trash2 } from 'lucide-react';

/**
 * Arctic Frost Theme - Entry Row Component
 * 
 * Features:
 * - Spotlight on Ice effect when active (af-grid-row-active)
 * - Flash freeze animation on save (af-animate-freeze)
 * - High-contrast financial display (af-grid-cell-hero)
 * - Large touch targets for gloved hands (min-h-12)
 * 
 * Refactored to use Arctic Frost CSS utility classes (arctic-frost.css)
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

  // Determine row classes based on state
  const getRowClassName = () => {
    const classes = ['af-grid-row'];
    
    if (isActive) {
      classes.push('af-grid-row-active');
    }
    
    if (isSaving || justSaved) {
      classes.push('af-animate-freeze');
    }
    
    return classes.join(' ');
  };

  return (
    <tr 
      ref={ref}
      className={getRowClassName()}
      onFocus={handleRowFocus}
      onBlur={handleRowBlur}
      tabIndex={-1}
    >
      {/* Farmer Cell */}
      <td className="af-grid-cell">
        <input
          ref={farmerRef}
          type="text"
          value={selectedFarmer?.name || ''}
          onChange={(e) => setFarmerId(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, weightRef)}
          disabled={isSaving}
          placeholder="Select farmer"
          className="af-input af-focus-glow"
          readOnly={!isNew}
          aria-label="Farmer name"
          style={{
            width: '100%',
            padding: 'var(--af-space-3) var(--af-space-4)',
          }}
        />
      </td>

      {/* Weight Cell (Hero) */}
      <td className="af-grid-cell">
        <input
          ref={weightRef}
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, null)}
          disabled={isSaving}
          placeholder="0.00"
          className="af-input-hero af-focus-glow"
          aria-label="Weight in kg"
          style={{
            width: '100%',
            padding: 'var(--af-space-3) var(--af-space-4)',
            fontFamily: 'var(--af-font-mono)'
          }}
        />
      </td>

      {/* Adjustments Cell */}
      <td className="af-grid-cell">
        <div 
          className="af-flex-center af-gap-2"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--af-space-2)'
          }}
        >
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
                  af-btn af-btn-sm 
                  ${isSelected 
                    ? (adj.type === 'deduction' ? 'af-error' : 'af-success')
                    : 'af-btn-ghost'
                  }
                  af-hover-luminous
                `}
                aria-pressed={isSelected}
                aria-label={`${adj.label} adjustment`}
                style={{
                  padding: 'var(--af-space-1) var(--af-space-3)',
                  fontSize: '0.8125rem'
                }}
              >
                {adj.label}
              </button>
            );
          })}
          
          {/* Adjustment Total Badge */}
          {adjustmentPercentage !== 0 && (
            <span 
              className={`
                af-text-sm af-font-medium
                ${adjustmentPercentage > 0 ? 'af-text-success' : 'af-text-error'}
              `}
              style={{
                marginLeft: 'var(--af-space-2)',
                padding: 'var(--af-space-1) var(--af-space-2)',
                borderRadius: 'var(--af-radius-full)',
                background: adjustmentPercentage > 0 
                  ? 'var(--af-success-bg)' 
                  : 'var(--af-error-bg)'
              }}
            >
              {adjustmentPercentage > 0 ? '+' : ''}{adjustmentPercentage}%
            </span>
          )}
        </div>
      </td>

      {/* Rate Cell */}
      <td className="af-grid-cell">
        <div 
          className="af-grid-cell-hero af-text-right"
          style={{
            color: 'var(--af-white-100)',
            fontSize: '1rem',
            fontWeight: 500,
            textAlign: 'right'
          }}
          aria-label="Rate per kg"
        >
          ₹{currentRate?.toFixed(2) || '0.00'}
        </div>
      </td>

      {/* Total Cell (Hero) */}
      <td className="af-grid-cell">
        <div 
          className={`
            af-grid-cell-hero af-text-right
            ${adjustmentPercentage > 0 ? 'af-text-success' : ''}
            ${adjustmentPercentage < 0 ? 'af-text-error' : ''}
          `}
          style={{
            color: adjustmentPercentage === 0 
              ? 'var(--af-white-100)' 
              : 'inherit',
            fontSize: '1.125rem',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right'
          }}
          aria-label="Total amount"
        >
          ₹{total}
        </div>
      </td>

      {/* Actions Cell */}
      <td className="af-grid-cell">
        <div 
          className="af-grid-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--af-space-2)'
          }}
        >
          {/* Saved Checkmark */}
          {showSaved && (
            <div 
              className="af-success af-flex-center af-animate-scale-in"
              aria-label="Saved"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--af-success-bg)',
                border: '1px solid var(--af-success)'
              }}
            >
              <Check size={18} strokeWidth={2.5} />
            </div>
          )}
          
          {/* Delete Button - 44x44px minimum touch target */}
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={isSaving || isSaved}
              className="af-btn af-btn-ghost af-hover-luminous"
              aria-label="Delete entry"
              style={{ 
                minWidth: '44px', 
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--af-space-2)'
              }}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

EntryRow.displayName = 'EntryRow';

export default EntryRow;
