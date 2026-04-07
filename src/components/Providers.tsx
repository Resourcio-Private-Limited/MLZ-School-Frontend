"use client";

import { Provider } from 'react-redux';
import { store } from '@/redux';
import { useEffect } from 'react';
import { hydrateAuth } from '@/redux/slices/authSlice';

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
      {children}
    </Provider>
  );
}