import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/arctic-frost.css';
import { registerServiceWorker, onMessageFromSW } from './utils/offlineUtils';
import { initDB } from './store/offlineStore';

// Initialize IndexedDB
initDB().catch(console.error);

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
  
  // Listen for sync completion messages
  onMessageFromSW((message) => {
    if (message.type === 'SYNC_COMPLETE') {
      console.log('Sync completed:', message.data);
      // Trigger UI refresh or show notification
      window.dispatchEvent(new CustomEvent('sync-complete', { detail: message.data }));
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
