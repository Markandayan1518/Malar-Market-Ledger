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
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-ice-border border-t-glacier-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Search Bar - Arctic */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search 
              size={18} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-cool" 
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={t('common.search')}
              className="
                w-full pl-12 pr-4 py-3 
                bg-arctic-ice 
                border border-ice-border 
                rounded-arctic
                text-slate-deep font-arctic
                placeholder:text-slate-mist
                focus:outline-none 
                focus:border-glacier-500 
                focus:ring-2 
                focus:ring-glacier-100
                transition-all duration-200
              "
            />
          </div>
        </div>
      )}

      {/* Table - Arctic Grid */}
      <div className="bg-arctic-ice border border-ice-border rounded-arctic overflow-hidden shadow-arctic-md">
        <table className="w-full">
          <thead 
            className="sticky top-0 z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '1px solid #E2E8F0'
            }}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`
                    px-4 py-3.5 text-xs font-semibold text-slate-cool uppercase tracking-wider
                    ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                    ${sortable && column.sortable ? 'cursor-pointer hover:text-glacier-500 transition-colors duration-150' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {sortable && column.sortable && sortColumn?.key === column.key && (
                      <span className="text-glacier-500">
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
                    border-b border-ice-border
                    transition-all duration-150
                    bg-arctic-ice even:bg-arctic-snow/50
                    ${onRowClick ? 'cursor-pointer hover:bg-arctic-frost' : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={`
                        px-4 py-4
                        ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                        ${column.mono ? 'font-mono' : 'font-arctic'}
                        ${column.hero ? 'text-lg font-bold text-slate-charcoal' : 'text-sm text-slate-deep'}
                      `}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-arctic-frost flex items-center justify-center">
                      <Search size={24} className="text-slate-cool" />
                    </div>
                    <p className="text-slate-cool font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Arctic */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-slate-cool">
            {t('common.showing')} {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredAndSortedData.length)} {t('common.of')} {filteredAndSortedData.length}
          </p>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
            >
              {t('common.previous')}
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
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
                      min-w-[40px] h-10 rounded-lg text-sm font-medium 
                      transition-all duration-200
                      ${currentPage === page 
                        ? 'bg-glacier-500 text-white shadow-arctic-btn' 
                        : 'text-slate-deep hover:bg-arctic-frost'
                      }
                    `}
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
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
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
