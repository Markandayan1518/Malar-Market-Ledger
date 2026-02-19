/**
 * Utility function to merge class names
 * A simple replacement for clsx/cn from libraries
 * 
 * @param {...any} classes - Class names to merge
 * @returns {string} - Merged class names
 */
export const cn = (...classes) => {
  return classes
    .filter(Boolean)
    .flatMap(cls => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .join(' ');
};

export default cn;
