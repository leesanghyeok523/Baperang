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
  initializeAuth: () => Promise<void>;
  setUserData: (userData: User) => void;
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

          // 여러 헤더 이름을 시도
          const accessToken =
            response.headers.get('accessToken') ||
            response.headers.get('Authorization') ||
            response.headers.get('Access-Token') ||
            response.headers.get('access-token');

          // 토큰 갱신 성공 시 인증 상태도 함께 업데이트
          if (accessToken) {
            // Bearer 접두사 추가 포맷팅
            const formattedToken = accessToken.startsWith('Bearer ')
              ? accessToken
              : `Bearer ${accessToken}`;

            set({
              accessToken: formattedToken,
              isAuthenticated: true,
            });
            return true;
          }

          // 토큰은 응답 본문에 있을 수도 있음
          try {
            const data = await response.json();

            if (data.accessToken || data.token) {
              const token = data.accessToken || data.token;
              const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

              set({
                accessToken: formattedToken,
                isAuthenticated: true,
              });
              return true;
            }
          } catch {
            // 응답 본문 처리 중 오류가 있어도 무시
          }

          return false;
        } catch {
          return false;
        }
      },

      // 인증 초기화 함수
      initializeAuth: async () => {
        const currentToken = get().accessToken;

        // 이미 인증된 상태인 경우 추가 검증 없이 리턴
        if (get().isAuthenticated && currentToken) {
          return;
        }

        // 토큰이 있는 경우 사용자 정보 가져오기 시도
        if (currentToken) {
          set({ isLoading: true });
          try {
            // 사용자 정보 가져오기 (세션 유효성 확인)
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.USER_INFO), {
              method: 'GET',
              headers: {
                Authorization: `${currentToken}`,
              },
              credentials: 'include',
            });

            // 세션이 유효한 경우
            if (response.ok) {
              const userData = await response.json();

              set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }

            // 세션이 만료된 경우 토큰 새로고침 시도
            const refreshed = await get().refreshToken();

            // 토큰 새로고침 성공 시 사용자 정보 다시 가져오기
            if (refreshed) {
              try {
                const userResponse = await fetch(
                  API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.USER_INFO),
                  {
                    method: 'GET',
                    headers: {
                      Authorization: `${get().accessToken}`,
                    },
                    credentials: 'include',
                  }
                );

                if (userResponse.ok) {
                  const userData = await userResponse.json();

                  set({
                    user: userData,
                    isAuthenticated: true,
                  });
                } else {
                  set({ isAuthenticated: false });
                }
              } catch {
                set({ isAuthenticated: false });
              }
            } else {
              // 토큰 갱신 실패시 로그아웃 처리
              await get().logout();
            }
          } catch {
            await get().logout();
          } finally {
            set({ isLoading: false });
          }
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      },

      // 사용자 데이터 설정 함수
      setUserData: (userData) => {
        set({ user: userData });
      },
    }),
    {
      name: 'auth-storage',
      // localStorage에 저장할 상태 필드 지정 - 토큰, 사용자 정보, 인증 상태 모두 저장
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
