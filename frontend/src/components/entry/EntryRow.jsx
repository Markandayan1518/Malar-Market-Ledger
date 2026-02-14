import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Trash2, Edit2 } from 'lucide-react';

const EntryRow = ({
  entry,
  farmers,
  currentRate,
  onUpdate,
  onDelete,
  isSaved = false,
  isSaving = false,
  isNew = false
}) => {
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
    
    // Apply adjustments
    adjustments.forEach(adj => {
      if (adj === 'late') total *= 0.95; // 5% deduction
      if (adj === 'wet') total *= 0.90; // 10% deduction
      if (adj === 'bonus') total *= 1.05; // 5% bonus
      if (adj === 'premium') total *= 1.10; // 10% premium
      if (adj === 'first_time') total *= 1.02; // 2% first time
    });
    
    return total.toFixed(2);
  };

  const total = calculateTotal();

  useEffect(() => {
    if (isSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

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

  return (
    <tr 
      className={`
        transition-all duration-300
        ${isSaved ? 'entry-row-saved' : ''}
        ${isSaving ? 'opacity-60' : ''}
      `}
    >
      {/* Farmer Cell */}
      <td className="py-2">
        <input
          ref={farmerRef}
          type="text"
          value={selectedFarmer?.name || ''}
          onChange={(e) => setFarmerId(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, weightRef)}
          disabled={isSaving}
          placeholder="Select farmer"
          className={`
            entry-cell w-full text-sm
            ${showSaved ? 'entry-cell-saved' : ''}
          `}
        />
      </td>

      {/* Weight Cell */}
      <td className="py-2">
        <input
          ref={weightRef}
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, null)}
          disabled={isSaving}
          placeholder="0.00"
          className={`
            entry-cell w-full text-sm font-mono text-right
            ${showSaved ? 'entry-cell-saved' : ''}
          `}
        />
      </td>

      {/* Adjustments Cell */}
      <td className="py-2">
        <div className="flex flex-wrap gap-1">
          {['late', 'wet', 'bonus', 'premium', 'first_time'].map(adj => {
            const isSelected = adjustments.includes(adj);
            return (
              <button
                key={adj}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setAdjustments(adjustments.filter(a => a !== adj));
                  } else {
                    setAdjustments([...adjustments, adj]);
                  }
                }}
                disabled={isSaving}
                className={`
                  px-2 py-1 rounded text-xs font-medium transition-all duration-150 border-2
                  ${isSelected 
                    ? (adj === 'late' || adj === 'wet') 
                      ? 'bg-red-100 border-red-400 text-red-800' 
                      : 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'text-warm-brown border-warm-taupe hover:border-warm-brown hover:bg-warm-sand'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {adj === 'late' && 'Late'}
                {adj === 'wet' && 'Wet'}
                {adj === 'bonus' && 'Bonus'}
                {adj === 'premium' && 'Premium'}
                {adj === 'first_time' && 'New'}
              </button>
            );
          })}
        </div>
      </td>

      {/* Rate Cell */}
      <td className="py-2">
        <div className="text-sm font-mono text-right">
          ₹{currentRate?.toFixed(2) || '0.00'}
        </div>
      </td>

      {/* Total Cell */}
      <td className="py-2">
        <div className="text-sm font-mono text-right font-semibold">
          ₹{total}
        </div>
      </td>

      {/* Actions Cell */}
      <td className="py-2">
        <div className="flex items-center justify-end gap-2">
          {showSaved && (
            <CheckCircle size={20} className="text-accent-emerald" />
          )}
          
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={isSaving || isSaved}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
              aria-label="Delete entry"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default EntryRow;
