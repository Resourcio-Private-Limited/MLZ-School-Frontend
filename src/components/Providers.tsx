"use client";

import { Provider } from 'react-redux';
import { store } from '@/redux';
import { useEffect } from 'react';
import { hydrateAuth } from '@/redux/slices/authSlice';
import { Toaster } from 'react-hot-toast';

function HydrateAuth() {
  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <HydrateAuth />
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            zIndex: 99999,
          },
          success: {
            duration: 4000,
            style: {
              background: '#059669',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#dc2626',
              color: '#fff',
            },
          },
        }}
      />
      {children}
    </Provider>
  );
}