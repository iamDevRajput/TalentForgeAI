/**
 * main.jsx — Application entry point
 *
 * Provider stack (order matters):
 *   1. BrowserRouter — React Router context
 *   2. QueryClientProvider — TanStack Query cache (server state)
 *   3. ToastProvider — Global notification system
 *   4. App — Route definitions
 *
 * WHY TanStack Query at the root level:
 *   Every phase uses it for data fetching. Placing it here means all
 *   components share one cache — a refetch in the pipeline view invalidates
 *   the analytics cache automatically via query key management.
 *
 * StrictMode: Enabled — React 19's improved StrictMode behavior (no double
 * invocation in production) makes this safe to leave on.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components/Toast';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch when window regains focus in development (noisy)
      refetchOnWindowFocus: import.meta.env.PROD,
      // Retry once on failure (network hiccup); don't retry 401s
      retry: (failureCount, error) => {
        if (error?.response?.status === 401) return false;
        if (error?.response?.status === 403) return false;
        return failureCount < 1;
      },
      staleTime: 30 * 1000, // 30 seconds — reduces redundant requests
    },
    mutations: {
      // No global mutation defaults needed — handle per mutation
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
