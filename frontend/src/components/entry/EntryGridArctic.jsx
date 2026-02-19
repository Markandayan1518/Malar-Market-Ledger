import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, RefreshCw, Check } from 'lucide-react';
import EntryRow from './EntryRow';
import FlowerTypeDropdown from './FlowerTypeDropdown';
import AddToProfileDialog from './AddToProfileDialog';

/**
 * Arctic Frost Theme - Entry Grid Component (Read-Only View)
 * 
 * Features:
 * - High-density table for desktop (15-20 rows visible)
 * - Row height: 40-48px compact
 * - Active row highlight: Glacier Cyan (#ECFEFF)
 * - Table headers: Uppercase, 12px, bold, cool gray
 * - Horizontal scroll with sticky first column on tablet
 * 
 * Can work in both read-only mode (for DailyEntryPageArctic) and 
 * edit mode (for adding/editing entries)
 */
const EntryGridArctic = ({
  entries = [],
  farmers = [],
  flowerTypes = [],
  currentRate,
  ratesByFlower = {},
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading = false,
  getFarmerName,
  getFlowerTypeName,
  readOnly = false,
  onShowAddToProfileDialog = () => {}
}) => {
  const { t } = useTranslation();
  const [newEntry, setNewEntry] = useState({
    farmerId: '',
    flowerTypeId: '',
    weight: '',
    adjustments: []
  });
  const [savingEntries, setSavingEntries] = useState(new Set());
  const [savedEntries, setSavedEntries] = useState(new Set());
  const [activeRowId, setActiveRowId] = useState(null);
  const firstRowRef = useRef(null);
  const newFarmerRef = useRef(null);
  const newWeightRef = useRef(null);
  
  // Add to profile dialog state
  const [addToProfileDialog, setAddToProfileDialog] = useState({
    isOpen: false,
    farmerId: null,
    farmerName: '',
    flowerId: null,
    flowerName: ''
  });
  const [addingToProfile, setAddingToProfile] = useState(false);

  // Get the rate for a specific flower type
  const getRateForFlower = (flowerTypeId) => {
    if (!flowerTypeId) return currentRate || 0;
    return ratesByFlower[flowerTypeId] || currentRate || 0;
  };

  // Get the current rate for the new entry (based on selected flower type)
  const activeRate = getRateForFlower(newEntry.flowerTypeId);

  const handleAddEntry = () => {
    if (!newEntry.farmerId || !newEntry.weight) return;
    
    const entry = {
      id: `new-${Date.now()}`,
      farmerId: newEntry.farmerId,
      flowerTypeId: newEntry.flowerTypeId || null,
      weight: parseFloat(newEntry.weight),
      adjustments: newEntry.adjustments,
      total: calculateTotal(newEntry.weight, newEntry.adjustments, activeRate),
      isNew: true
    };
    
    onAddEntry(entry);
    
    // Reset form but keep farmer for quick multiple entries
    setNewEntry(prev => ({
      farmerId: prev.farmerId, // Keep farmer for quick successive entries
      flowerTypeId: prev.flowerTypeId, // Keep flower type too
      weight: '',
      adjustments: []
    }));
    
    setTimeout(() => {
      newWeightRef.current?.focus();
    }, 100);
  };

  const calculateTotal = (weight, adjustments, rate) => {
    if (!weight || !rate) return 0;
    const weightNum = parseFloat(weight);
    const rateNum = parseFloat(rate);
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

  // Handle flower type suggestion applied
  const handleSuggestionApplied = useCallback((flower) => {
    // Could show a toast notification here
    console.log('Auto-selected flower:', flower.name);
  }, []);

  // Handle non-suggested flower selection (show dialog)
  const handleNonSuggestedSelect = useCallback((farmerId, flower) => {
    const farmer = farmers.find(f => f.id === farmerId);
    setAddToProfileDialog({
      isOpen: true,
      farmerId,
      farmerName: farmer?.name || '',
      flowerId: flower.id,
      flowerName: flower.name
    });
  }, [farmers]);

  // Handle add to profile dialog confirm
  const handleAddToProfileConfirm = async () => {
    if (!addToProfileDialog.farmerId || !addToProfileDialog.flowerId) return;
    
    setAddingToProfile(true);
    try {
      // Call the parent callback to add the flower to farmer's profile
      await onShowAddToProfileDialog({
        farmerId: addToProfileDialog.farmerId,
        flowerTypeId: addToProfileDialog.flowerId
      });
      
      // Close dialog on success
      setAddToProfileDialog(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Failed to add flower to profile:', error);
    } finally {
      setAddingToProfile(false);
    }
  };

  // Handle add to profile dialog close
  const handleAddToProfileClose = () => {
    setAddToProfileDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateEntry = (entry) => {
    setSavingEntries(prev => new Set([...prev, entry.id]));
    onUpdateEntry(entry);
    
    setTimeout(() => {
      setSavingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
      setSavedEntries(prev => new Set([...prev, entry.id]));
      setTimeout(() => {
        setSavedEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entry.id);
          return newSet;
        });
      }, 2000);
    }, 600);
  };

  const handleDeleteEntry = (entryId) => {
    onDeleteEntry(entryId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setNewEntry({ farmerId: '', weight: '', adjustments: [] });
      setActiveRowId(null);
    }
    if (e.key === 'Enter' && e.target === newWeightRef.current) {
      e.preventDefault();
      handleAddEntry();
    }
  };

  const allEntries = [...entries];

  const totalWeight = allEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.weight) || 0);
  }, 0);

  const totalAmount = allEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.total) || 0);
  }, 0);

  useEffect(() => {
    if (entries.length === 0 && !newEntry.farmerId && !newEntry.weight) {
      firstRowRef.current?.focus();
    }
  }, [entries, newEntry]);

  const selectedFarmer = farmers.find(f => f.id === newEntry.farmerId);
  const newEntryTotal = calculateTotal(newEntry.weight, newEntry.adjustments, activeRate);

  return (
    <div 
      className="af-gap-4 af-animate-thaw" 
      onKeyDown={handleKeyDown}
      data-theme="arctic"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--af-space-4)'
      }}
    >
      {/* Header Bar */}
      <div 
        className="af-flex-between af-mb-6"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--af-space-6)'
        }}
      >
        <div 
          className="af-flex-center af-gap-4"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--af-space-4)'
          }}
        >
          <h2 className="af-text-2xl af-font-bold af-text-primary">
            {t('dailyEntry.title')}
          </h2>
          
          {/* Current Rate Badge */}
          <div 
            className="af-btn-primary af-hover-luminous"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--af-space-2)',
              padding: 'var(--af-space-2) var(--af-space-4)',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 'var(--af-radius-full)'
            }}
          >
            <span>
              {t('dailyEntry.currentRate', { rate: currentRate || '0.00' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div 
        className="af-grid af-grid-responsive af-mb-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--af-space-4)',
          marginBottom: 'var(--af-space-6)'
        }}
      >
        <div className="af-surface-card af-surface-card-hover af-hover-luminous">
          <p className="af-text-sm af-text-muted">{t('dashboard.totalEntries')}</p>
          <p className="af-text-xl af-font-semibold af-text-primary">{allEntries.length}</p>
        </div>
        <div className="af-surface-card af-surface-card-hover af-hover-luminous">
          <p className="af-text-sm af-text-muted">{t('dashboard.totalWeight')}</p>
          <p className="af-text-xl af-font-semibold af-text-primary">
            {totalWeight.toFixed(2)}
            <span className="af-text-sm af-text-muted" style={{ marginLeft: 'var(--af-space-1)' }}>kg</span>
          </p>
        </div>
        <div className="af-surface-card af-surface-card-hover af-hover-luminous">
          <p className="af-text-sm af-text-muted">{t('dashboard.totalAmount')}</p>
          <p className="af-text-xl af-font-semibold af-text-primary">₹{totalAmount.toFixed(2)}</p>
        </div>
        <div className="af-surface-card af-surface-card-hover af-hover-luminous">
          <p className="af-text-sm af-text-muted">Avg/Entry</p>
          <p className="af-text-xl af-font-semibold af-text-primary">
            ₹{allEntries.length > 0 ? (totalAmount / allEntries.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Entry Grid Container */}
      <div 
        className={`af-bg-frost-lg ${activeRowId ? 'has-active-row' : ''}`}
        style={{
          background: 'var(--af-glass-12)',
          backdropFilter: 'blur(var(--af-blur-xl))',
          WebkitBackdropFilter: 'blur(var(--af-blur-xl))',
          borderRadius: 'var(--af-radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: 'var(--af-shadow-frost)'
        }}
      >
        {loading ? (
          <div 
            className="af-flex-center af-p-12"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--af-space-12)'
            }}
          >
            <div 
              className="af-animate-spin af-loading-shimmer"
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--af-glass-15)',
                borderTop: '3px solid var(--af-periwinkle-400)',
                borderRadius: '50%'
              }}
            />
          </div>
        ) : (
          <table className="af-w-full" style={{ width: '100%' }}>
            {/* Frosted Glass Header */}
            <thead className="af-grid-header">
              <tr>
                <th className="af-text-left" style={{ minWidth: '180px' }}>{t('dailyEntry.farmer')}</th>
                <th className="af-text-left" style={{ minWidth: '140px' }}>{t('dailyEntry.flowerType', 'Flower Type')}</th>
                <th className="af-text-right" style={{ minWidth: '100px' }}>{t('dailyEntry.weight')}</th>
                <th style={{ minWidth: '200px' }}>{t('dailyEntry.adjustments')}</th>
                <th className="af-text-right" style={{ minWidth: '80px' }}>{t('dailyEntry.rate')}</th>
                <th className="af-text-right" style={{ minWidth: '100px' }}>{t('dailyEntry.amount')}</th>
                <th className="af-text-center" style={{ width: '80px' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            
            <tbody>
              {/* New Entry Row (Always visible at top) */}
              <tr 
                className={`af-grid-row ${activeRowId === 'new' ? 'af-grid-row-active' : ''}`}
                onFocus={() => setActiveRowId('new')}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setActiveRowId(null);
                  }
                }}
              >
                {/* Farmer Input */}
                <td>
                  <input
                    ref={newFarmerRef}
                    type="text"
                    value={selectedFarmer?.name || ''}
                    onChange={(e) => {
                      const farmer = farmers.find(f => 
                        f.name.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setNewEntry(prev => ({ ...prev, farmerId: farmer?.id || '' }));
                    }}
                    placeholder="Select farmer..."
                    className="af-input af-focus-glow"
                    data-new-entry="true"
                    style={{
                      width: '100%',
                      padding: 'var(--af-space-3) var(--af-space-4)',
                      background: 'var(--af-glass-08)',
                      border: '1px solid transparent',
                      borderRadius: 'var(--af-radius-lg)',
                      color: 'var(--af-white-100)'
                    }}
                  />
                </td>

                {/* Flower Type Dropdown (with Smart Suggestion) */}
                <td>
                  <FlowerTypeDropdown
                    value={newEntry.flowerTypeId}
                    onChange={(flowerTypeId) => setNewEntry(prev => ({ ...prev, flowerTypeId }))}
                    flowerTypes={flowerTypes}
                    farmerId={newEntry.farmerId}
                    placeholder={t('dailyEntry.selectFlowerType', 'Select flower...')}
                    onSuggestionApplied={handleSuggestionApplied}
                    onNonSuggestedSelect={handleNonSuggestedSelect}
                  />
                </td>

                {/* Weight Input (Hero) */}
                <td>
                  <input
                    ref={newWeightRef}
                    type="text"
                    inputMode="decimal"
                    value={newEntry.weight}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0.00"
                    className="af-input-hero af-focus-glow"
                    style={{
                      width: '100%',
                      padding: 'var(--af-space-3) var(--af-space-4)',
                      background: 'var(--af-glass-10)',
                      border: '1px solid transparent',
                      borderRadius: 'var(--af-radius-lg)',
                      color: 'var(--af-white-100)',
                      fontFamily: 'var(--af-font-mono)'
                    }}
                  />
                </td>

                {/* Adjustments */}
                <td>
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
                      const isSelected = newEntry.adjustments.includes(adj.key);
                      return (
                        <button
                          key={adj.key}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewEntry(prev => ({
                                ...prev,
                                adjustments: prev.adjustments.filter(a => a !== adj.key)
                              }));
                            } else {
                              setNewEntry(prev => ({
                                ...prev,
                                adjustments: [...prev.adjustments, adj.key]
                              }));
                            }
                          }}
                          className={`af-btn af-btn-sm ${isSelected ? 'af-btn-primary' : 'af-btn-ghost'} af-hover-luminous`}
                          style={{
                            padding: 'var(--af-space-1) var(--af-space-3)',
                            fontSize: '0.8125rem',
                            background: isSelected 
                              ? (adj.type === 'deduction' ? 'var(--af-error-bg)' : 'var(--af-success-bg)')
                              : 'transparent',
                            borderColor: isSelected
                              ? (adj.type === 'deduction' ? 'var(--af-error)' : 'var(--af-success)')
                              : 'rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {adj.label}
                        </button>
                      );
                    })}
                  </div>
                </td>

                {/* Rate */}
                <td>
                  <div
                    className="af-grid-cell-hero af-text-right"
                    style={{
                      color: 'var(--af-white-100)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      textAlign: 'right'
                    }}
                  >
                    ₹{activeRate?.toFixed(2) || '0.00'}
                  </div>
                </td>

                {/* Total */}
                <td>
                  <div 
                    className="af-grid-cell-hero af-text-right"
                    style={{
                      color: 'var(--af-white-100)',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right'
                    }}
                  >
                    ₹{newEntryTotal}
                  </div>
                </td>

                {/* Add Button */}
                <td>
                  <button
                    onClick={handleAddEntry}
                    disabled={!newEntry.farmerId || !newEntry.weight}
                    className="af-btn af-btn-primary af-hover-luminous af-w-full"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--af-space-2)',
                      padding: 'var(--af-space-3) var(--af-space-4)'
                    }}
                  >
                    <Plus size={18} />
                    <span>Add</span>
                  </button>
                </td>
              </tr>

              {/* Existing Entries */}
              {allEntries.map((entry, index) => (
                <EntryRow
                  key={entry.id}
                  ref={index === 0 ? firstRowRef : null}
                  entry={entry}
                  farmers={farmers}
                  currentRate={currentRate}
                  onUpdate={handleUpdateEntry}
                  onDelete={handleDeleteEntry}
                  isSaved={savedEntries.has(entry.id)}
                  isSaving={savingEntries.has(entry.id)}
                  isNew={entry.isNew}
                  isActive={activeRowId === entry.id}
                  onActivate={() => setActiveRowId(entry.id)}
                  onDeactivate={() => setActiveRowId(null)}
                />
              ))}
              
              {/* Empty State */}
              {allEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="af-text-center" style={{ textAlign: 'center', padding: 'var(--af-space-16)' }}>
                    <div 
                      className="af-flex-center af-gap-3"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--af-space-3)'
                      }}
                    >
                      <div 
                        className="af-bg-frost af-flex-center"
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--af-glass-10)'
                        }}
                      >
                        <Plus size={24} className="af-text-muted" />
                      </div>
                      <p className="af-text-muted af-font-medium">
                        No entries yet. Add your first entry above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Footer with Totals */}
            {allEntries.length > 0 && (
              <tfoot
                className="af-surface-panel"
                style={{
                  background: 'var(--af-glass-15)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <tr>
                  <td
                    className="af-font-semibold af-text-primary"
                    style={{
                      fontWeight: 600,
                      color: 'var(--af-white-100)',
                      padding: 'var(--af-space-4) var(--af-space-6)'
                    }}
                  >
                    TOTALS
                  </td>
                  <td></td>
                  <td
                    className="af-text-right"
                    style={{ textAlign: 'right', padding: 'var(--af-space-4) var(--af-space-6)' }}
                  >
                    <span
                      className="af-grid-cell-hero"
                      style={{
                        color: 'var(--af-white-100)',
                        fontWeight: 600
                      }}
                    >
                      {totalWeight.toFixed(2)}
                    </span>
                    <span className="af-text-sm af-text-muted" style={{ marginLeft: 'var(--af-space-1)' }}>kg</span>
                  </td>
                  <td></td>
                  <td></td>
                  <td
                    className="af-text-right"
                    style={{ textAlign: 'right', padding: 'var(--af-space-4) var(--af-space-6)' }}
                  >
                    <span
                      className="af-grid-cell-hero"
                      style={{
                        color: 'var(--af-periwinkle-400)',
                        fontWeight: 600
                      }}
                    >
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Add to Profile Dialog */}
      <AddToProfileDialog
        isOpen={addToProfileDialog.isOpen}
        onClose={handleAddToProfileClose}
        onConfirm={handleAddToProfileConfirm}
        farmerName={addToProfileDialog.farmerName}
        flowerName={addToProfileDialog.flowerName}
        loading={addingToProfile}
      />
    </div>
  );
};

export default EntryGrid;
export { EntryGrid };
