import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OverlayProviders from './components/neroOverlay/OverlayProviders';

// Import RainbowKit styles AFTER your own global styles (index.css)
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <OverlayProviders>
        <App />
      </OverlayProviders>
    </QueryClientProvider>
  </React.StrictMode>,
);

