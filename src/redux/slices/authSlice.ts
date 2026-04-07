import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  student?: {
    id: string;
    fullName: string;
    admissionNumber: string;
    classroom: { id: string; name: string; grade: string; section: string };
  };
  teacher?: {
    id: string;
    fullName: string;
    employeeId: string;
    designation: string | null;
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  resetEmail: string | null; // email stored while going through reset flow
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isFirstLogin: false,
  resetEmail: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.token);
        localStorage.setItem('authUser', JSON.stringify(action.payload.user));
      }
    },

    setFirstLogin(state, action: PayloadAction<boolean>) {
      state.isFirstLogin = action.payload;
    },

    setResetEmail(state, action: PayloadAction<string>) {
      state.resetEmail = action.payload;
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isFirstLogin = false;
      state.resetEmail = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
      }
    },

    hydrateAuth(state) {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('accessToken');
      const rawUser = localStorage.getItem('authUser');
      if (token && rawUser) {
        try {
          state.token = token;
          state.user = JSON.parse(rawUser) as AuthUser;
          state.isAuthenticated = true;
        } catch {
          // corrupted data — clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('authUser');
        }
      }
    },
  },
});

export const { setCredentials, setFirstLogin, setResetEmail, logout, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;