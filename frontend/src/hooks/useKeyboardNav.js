import { useEffect, useCallback } from 'react';

const useKeyboardNav = (containerRef, onEscape, options = {}) => {
  const {
    trapFocus = true,
    restoreFocus = true
  } = options;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Find all focusable elements
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || [];

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          
          if (e.shiftKey) {
            // Shift + Tab: Go to previous focusable element
            if (e.shiftKey === 'Tab') {
              e.preventDefault();
            }
            
            const currentIndex = focusableElements.indexOf(document.activeElement);
            if (currentIndex > 0) {
              focusableElements[currentIndex - 1]?.focus();
            }
          } else {
            // Normal Tab: Move to next focusable element
            const nextIndex = focusableElements.indexOf(document.activeElement);
            if (nextIndex < focusableElements.length - 1) {
              focusableElements[nextIndex + 1]?.focus();
            }
          }
          } else {
            // Tab: Move to next focusable element
            const nextIndex = focusableElements.indexOf(document.activeElement);
            if (nextIndex < focusableElements.length - 1) {
              focusableElements[nextIndex + 1]?.focus();
            }
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Arrow Up: Move to first element
            firstElement?.focus();
          } else {
            // Arrow Up: Move to previous focusable element
            const currentIndex = focusableElements.indexOf(document.activeElement);
            if (currentIndex > 0) {
              focusableElements[currentIndex - 1]?.focus();
            }
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Arrow Down: Move to last element
            lastElement?.focus();
          } else {
            // Arrow Down: Move to next focusable element
            const currentIndex = focusableElements.indexOf(document.activeElement);
            if (currentIndex < focusableElements.length - 1) {
              focusableElements[currentIndex + 1]?.focus();
            }
          }
          break;

        case 'Home':
          e.preventDefault();
          
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Home: Move to first element
            firstElement?.focus();
          } else {
            // Home: Move to first element
            firstElement?.focus();
          }
          break;

        case 'End':
          e.preventDefault();
          
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + End: Move to last element
            lastElement?.focus();
          } else {
            // End: Move to last element
            lastElement?.focus();
          }
          break;

        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
          // Enter: Trigger click on focused element
          if (document.activeElement && document.activeElement.click) {
            document.activeElement.click();
          }
          break;

        case 'F1':
        case 'F2':
        case 'F3':
        case 'F4':
        case 'F5':
        case 'F6':
        case 'F7':
        case 'F8':
        case 'F9':
        case 'F10':
        case 'F11':
        case 'F12':
          e.preventDefault();
          
          // Function keys: Trigger corresponding action
          const currentIndex = focusableElements.indexOf(document.activeElement);
          if (currentIndex !== -1) {
            focusableElements[currentIndex]?.focus();
          }
          break;

        default:
          // Let default behavior proceed
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [containerRef, onEscape, options]);

  return {
    containerRef
  };
};

export default useKeyboardNav;
