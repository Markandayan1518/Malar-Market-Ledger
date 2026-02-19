import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

/**
 * Arctic Frost Theme - Data Table Component
 * 
 * Features:
 * - Frosted glass header with sticky positioning
 * - High-contrast sorting indicators
 * - Smooth hover transitions
 * - Large touch targets
 * 
 * Refactored to use Arctic Frost CSS utility classes (arctic-frost.css)
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortable = true,
  searchable = false,
  pagination = false,
  pageSize = 10,
  className = ''
}) => {
  const { t } = useTranslation();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm && searchable) {
      result = result.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    if (sortable && sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn.key];
        const bValue = b[sortColumn.key];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, columns, searchable]);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredAndSortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage, pagination, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;

    if (sortColumn?.key === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="af-flex-center af-p-12">
        <div className="af-animate-spin af-loading-shimmer" style={{
          width: 40,
          height: 40,
          border: '3px solid var(--af-glass-15)',
          borderTop: '3px solid var(--af-periwinkle-400)',
          borderRadius: '50%'
        }} />
      </div>
    );
  }

  return (
    <div className={`af-w-full ${className}`} data-theme="arctic">
      {/* Search Bar */}
      {searchable && (
        <div className="af-mb-4">
          <div className="af-surface-input" style={{ position: 'relative' }}>
            <Search 
              size={18} 
              className="af-text-muted" 
              style={{
                position: 'absolute',
                left: 'var(--af-space-4)',
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={t('common.search')}
              className="af-input af-focus-glow"
              style={{
                width: '100%',
                paddingLeft: 'var(--af-space-12)',
                paddingRight: 'var(--af-space-4)',
                paddingTop: 'var(--af-space-3)',
                paddingBottom: 'var(--af-space-3)'
              }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="af-grid af-overflow-auto" style={{
        display: 'block',
        overflowX: 'auto'
      }}>
        <table className="af-w-full" style={{ width: '100%' }}>
          <thead className="af-grid-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`
                    ${sortable && column.sortable ? 'af-cursor-pointer af-hover-luminous' : ''}
                    ${column.align === 'right' ? 'af-text-right' : column.align === 'center' ? 'af-text-center' : 'af-text-left'}
                    af-transition
                  `}
                >
                  <div className="af-flex-center" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--af-space-2)'
                  }}>
                    <span className="af-text-primary">{column.label}</span>
                    {sortable && column.sortable && sortColumn?.key === column.key && (
                      <span className="af-text-accent">
                        {sortDirection === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    ${rowIndex % 2 === 0 ? 'af-grid-row' : 'af-grid-row-alt'}
                    ${onRowClick ? 'af-cursor-pointer' : ''}
                    af-hover-luminous
                  `}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={`
                        af-grid-cell
                        ${column.align === 'right' ? 'af-text-right' : column.align === 'center' ? 'af-text-center' : 'af-text-left'}
                        ${column.hero ? 'af-grid-cell-hero' : ''}
                      `}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="af-text-center" style={{ textAlign: 'center', padding: 'var(--af-space-16)' }}>
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
                        borderRadius: '50%'
                      }}
                    >
                      <Search size={24} className="af-text-muted" />
                    </div>
                    <p className="af-text-muted af-font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="af-flex-between af-mt-6" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 'var(--af-space-2)',
          paddingRight: 'var(--af-space-2)'
        }}>
          <p className="af-text-sm af-text-muted">
            {t('common.showing')} {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAndSortedData.length)} {t('common.of')} {filteredAndSortedData.length}
          </p>
          
          <div className="af-flex-center" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--af-space-2)'
          }}>
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="af-btn af-btn-secondary af-btn-sm"
            >
              {t('common.previous')}
            </button>
            
            {/* Page Numbers */}
            <div className="af-flex-center" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--af-space-1)'
            }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`
                      af-btn
                      ${currentPage === page ? 'af-btn-primary' : 'af-btn-ghost'}
                    `}
                    style={{
                      minWidth: '40px',
                      height: '40px',
                      padding: 'var(--af-space-2)',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="af-btn af-btn-secondary af-btn-sm"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
