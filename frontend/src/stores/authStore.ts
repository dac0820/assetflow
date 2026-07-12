import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: UserProfile) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setSession: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
  clearSession: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
