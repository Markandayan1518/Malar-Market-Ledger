import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

/**
 * MainLayout Component - Arctic Frost Design
 * 
 * Features:
 * - Theme-aware background
 * - Responsive layout with collapsible sidebar
 * - Page transition container
 * - Proper spacing with new header
 */
const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();

  const isArctic = theme === 'arctic';

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div
      className={`
        min-h-screen flex flex-col
        ${isArctic
          ? 'bg-arctic-frost'
          : 'bg-warm-cream'
        }
      `.replace(/\s+/g, ' ').trim()}
    >
      {/* Header */}
      <Header
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <main
          className={`
            flex-1 overflow-y-auto
            ${isArctic
              ? 'bg-gradient-to-br from-arctic-frost via-arctic-ice to-arctic-frost'
              : 'bg-warm-cream'
            }
          `.replace(/\s+/g, ' ').trim()}
        >
          {/* Page Transition Container */}
          <div
            className={`
              p-4 lg:p-6 max-w-7xl mx-auto
              animate-fade-in-up
              min-h-[calc(100vh-120px)]
            `.replace(/\s+/g, ' ').trim()}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
