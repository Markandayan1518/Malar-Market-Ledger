import { useState, useEffect } from 'react';
import DataTableArctic from './DataTableArctic';
import MobileCardList from './MobileCardList';

/**
 * ResponsiveTable - Switches between table and card views based on screen size
 * 
 * Features:
 * - Automatic view switching at breakpoint (768px)
 * - Sticky first column in table view
 * - Horizontal scroll indicators
 * - Touch-friendly card view on mobile
 * 
 * @param {Array} columns - Column definitions
 * @param {Array} data - Data array
 * @param {Function} onRowClick - Row click handler
 * @param {number} breakpoint - Pixel width to switch views (default: 768)
 * @param {Array} primaryFields - Fields to show in mobile card collapsed view
 * @param {boolean} collapsible - Allow expanding card details on mobile
 * @param {Object} tableProps - Additional props for DataTable
 * @param {Object} cardProps - Additional props for MobileCardList
 */
const ResponsiveTable = ({
  columns = [],
  data = [],
  onRowClick,
  breakpoint = 768,
  primaryFields = [],
  collapsible = true,
  tableProps = {},
  cardProps = {},
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [scrollIndicator, setScrollIndicator] = useState({ left: false, right: false });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  // Scroll indicator logic for table view
  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    setScrollIndicator({
      left: scrollLeft > 10,
      right: scrollLeft < scrollWidth - clientWidth - 10
    });
  };

  useEffect(() => {
    if (isMobile) return;
    
    const tableContainer = document.querySelector('.responsive-table-scroll');
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll({ target: tableContainer });
      
      return () => tableContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, data]);

  // Mobile view: Card list
  if (isMobile) {
    return (
      <div className={className}>
        <MobileCardList
          columns={columns}
          data={data}
          onRowClick={onRowClick}
          primaryFields={primaryFields}
          collapsible={collapsible}
          {...cardProps}
        />
      </div>
    );
  }

  // Desktop view: Table with horizontal scroll
  return (
    <div className={`relative ${className}`}>
      {/* Left scroll indicator */}
      {scrollIndicator.left && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, var(--af-surface) 0%, transparent 100%)'
          }}
        />
      )}
      
      {/* Right scroll indicator */}
      {scrollIndicator.right && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, var(--af-surface) 0%, transparent 100%)'
          }}
        />
      )}
      
      {/* Table container with horizontal scroll */}
      <div 
        className="responsive-table-scroll"
        style={{
          overflowX: 'auto',
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}
      >
        <DataTableArctic
          columns={columns}
          data={data}
          onRowClick={onRowClick}
          {...tableProps}
        />
      </div>
    </div>
  );
};

export default ResponsiveTable;

// Also export a hook for custom responsive logic
export const useResponsive = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return { isMobile, isDesktop: !isMobile };
};
