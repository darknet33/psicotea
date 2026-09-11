import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/axios";
import { setTokens, removeTokens } from "@/lib/auth";
import type {
  AuthResponse,
  ChangePasswordInput,
  UpdateProfileInput,
  User,
} from "@/types/user";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      async login(email, password) {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>("/auth/login", {
            email,
            password,
          });
          setTokens(data.access_token, data.refresh_token);
          set({ user: data.user });
        } finally {
          set({ isLoading: false });
        }
      },

      async updateProfile(input) {
        const { data } = await api.patch<User>("/auth/me", input);
        set({ user: data });
      },

      async changePassword(input) {
        await api.patch("/auth/password", input);
      },

      async fetchMe() {
        try {
          const { data } = await api.get<User>("/auth/me");
          set({ user: data });
        } catch {
          get().logout();
        }
      },

      async logout() {
        try {
          await api.post("/auth/logout");
        } finally {
          removeTokens();
          set({ user: null });
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
      },
    }),
    {
      name: "psicotea-auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export function useAuthErrorMessage(error: unknown) {
  return getErrorMessage(error);
}