import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

/**
 * MobileCardList - Mobile-friendly card layout for tabular data
 * 
 * Transforms table data into vertical cards for mobile viewing.
 * Supports collapsible details and swipe actions.
 * 
 * @param {Array} columns - Column definitions (same as DataTable)
 * @param {Array} data - Data array
 * @param {Function} onRowClick - Click handler for card
 * @param {boolean} collapsible - Allow expanding card details
 * @param {Array} primaryFields - Fields to show in collapsed view
 * @param {string} emptyMessage - Message when no data
 * @param {string} className - Additional CSS classes
 */
const MobileCardList = ({
  columns = [],
  data = [],
  onRowClick,
  collapsible = true,
  primaryFields = [],
  emptyMessage = 'No data available',
  className = ''
}) => {
  const { t } = useTranslation();
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Determine primary fields to show in collapsed view
  const getPrimaryColumns = () => {
    if (primaryFields.length > 0) {
      return columns.filter(col => primaryFields.includes(col.key));
    }
    // Default: show first 2-3 columns
    return columns.slice(0, Math.min(3, columns.length));
  };

  const getSecondaryColumns = () => {
    const primaryKeys = getPrimaryColumns().map(col => col.key);
    return columns.filter(col => !primaryKeys.includes(col.key));
  };

  const toggleCard = (id, e) => {
    e?.stopPropagation();
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isExpanded = (id) => expandedCards.has(id);

  const renderCellValue = (column, row) => {
    if (column.render) {
      return column.render(row);
    }
    const value = row[column.key];
    if (value === null || value === undefined) return '-';
    return value;
  };

  if (data.length === 0) {
    return (
      <div className="af-flex-center af-p-8" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--af-space-3)',
        padding: 'var(--af-space-8)'
      }}>
        <div 
          className="af-bg-frost"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronRight size={24} className="af-text-muted" />
        </div>
        <p className="af-text-muted af-font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const primaryColumns = getPrimaryColumns();
  const secondaryColumns = getSecondaryColumns();

  return (
    <div className={`af-w-full af-space-y-3 ${className}`} style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--af-space-3)'
    }}>
      {data.map((row, index) => {
        const rowId = row.id || index;
        const expanded = isExpanded(rowId);
        const hasDetails = secondaryColumns.length > 0 && collapsible;

        return (
          <div
            key={rowId}
            onClick={() => onRowClick?.(row)}
            className="af-surface af-radius af-transition"
            style={{
              background: 'var(--af-surface)',
              border: '1px solid var(--af-glass-15)',
              borderRadius: 'var(--af-radius)',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Primary Content - Always Visible */}
            <div 
              className="af-p-4"
              style={{
                padding: 'var(--af-space-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--af-space-3)',
                minHeight: '64px' // Touch target
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {primaryColumns.map((column, colIndex) => (
                  <div 
                    key={column.key}
                    style={{
                      display: colIndex === 0 ? 'flex' : 'block',
                      alignItems: 'baseline',
                      gap: 'var(--af-space-2)'
                    }}
                  >
                    {colIndex === 0 && column.hero && (
                      <span 
                        className="af-grid-cell-hero"
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: 'var(--af-white-100)',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {renderCellValue(column, row)}
                      </span>
                    )}
                    {colIndex === 0 && !column.hero && (
                      <span 
                        className="af-text-primary af-font-semibold"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: 'var(--af-white-100)'
                        }}
                      >
                        {renderCellValue(column, row)}
                      </span>
                    )}
                    {colIndex > 0 && (
                      <span 
                        className="af-text-sm af-text-muted"
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--af-slate-400)'
                        }}
                      >
                        {column.label}: {renderCellValue(column, row)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Expand Toggle */}
              {hasDetails && (
                <button
                  onClick={(e) => toggleCard(rowId, e)}
                  className="af-btn af-btn-ghost"
                  style={{
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--af-space-2)'
                  }}
                  aria-expanded={expanded}
                  aria-label={expanded ? 'Collapse details' : 'Expand details'}
                >
                  {expanded ? (
                    <ChevronUp size={20} className="af-text-muted" />
                  ) : (
                    <ChevronDown size={20} className="af-text-muted" />
                  )}
                </button>
              )}

              {/* Click Indicator */}
              {!hasDetails && onRowClick && (
                <ChevronRight size={20} className="af-text-muted" />
              )}
            </div>

            {/* Secondary Content - Expandable */}
            {hasDetails && expanded && (
              <div 
                className="af-border-t af-animate-fade-in"
                style={{
                  borderTop: '1px solid var(--af-glass-15)',
                  padding: 'var(--af-space-4)',
                  background: 'var(--af-glass-5)'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 'var(--af-space-3)'
                }}>
                  {secondaryColumns.map(column => (
                    <div key={column.key}>
                      <label 
                        className="af-text-xs af-text-muted af-uppercase"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--af-slate-400)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 'var(--af-space-1)',
                          display: 'block'
                        }}
                      >
                        {column.label}
                      </label>
                      <div 
                        className={column.hero ? 'af-grid-cell-hero' : 'af-text-primary'}
                        style={{
                          fontSize: column.hero ? '1.125rem' : '0.9375rem',
                          fontWeight: column.hero ? 600 : 500,
                          color: 'var(--af-white-100)',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {renderCellValue(column, row)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileCardList;
