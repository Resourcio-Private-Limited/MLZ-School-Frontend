import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // File downloads (admit-card PDFs) are returned as Blobs by RTK Query.
      serializableCheck: {
        ignoredActionPaths: ['payload', 'meta.arg', 'meta.baseQueryMeta'],
        ignoredPaths: [baseApi.reducerPath],
      },
    }).concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;