import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import API_CONFIG from '../config/api';

interface User {
  userPk: number;
  loginId: string;
  nutritionistName: string;
  city: string;
  schoolName: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 액션
  login: (credentials: { loginId: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
            credentials: 'include', // 쿠키 포함
          });

          if (!response.ok) throw new Error('로그인 실패');

          const accessToken = response.headers.get('Authorization');
          const userData = await response.json();

          // 토큰이 있고, Bearer 접두사가 없는 경우에만 추가
          const formattedToken = accessToken
            ? accessToken.startsWith('Bearer ')
              ? accessToken
              : `Bearer ${accessToken}`
            : null;

          // 디버깅용 로그
          console.log('응답에서 받은 원본 토큰:', accessToken);
          console.log('저장된 형식 토큰:', formattedToken);

          set({
            accessToken: formattedToken,
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${get().accessToken}`,
            },
            credentials: 'include',
          });
        } finally {
          set({ accessToken: null, user: null, isAuthenticated: false });
        }
      },

      refreshToken: async () => {
        try {
          const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN), {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) return false;

          const accessToken = response.headers.get('accessToken');
          set({ accessToken });
          return true;
        } catch {
          // 에러는 무시하고 실패로 처리
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
