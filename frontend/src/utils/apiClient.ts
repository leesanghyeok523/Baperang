import { useAuthStore } from '../store/authStore';

/**
 * 인증이 필요한 API 요청을 처리하는 함수
 * 만료된 토큰은 자동으로 갱신 시도
 */
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const authStore = useAuthStore.getState();

  // 헤더에 토큰 추가
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {}),
  };

  let response = await fetch(url, { ...options, headers, credentials: 'include' });

  // 401 오류시 토큰 갱신 시도
  if (response.status === 401) {
    const refreshSuccess = await authStore.refreshToken();

    if (refreshSuccess) {
      // 토큰 갱신 성공 시 원래 요청 재시도
      headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
      response = await fetch(url, { ...options, headers, credentials: 'include' });
    } else {
      // 토큰 갱신 실패 시 로그아웃
      authStore.logout();
      throw new Error('인증이 만료되었습니다');
    }
  }

  return response;
};

/**
 * API 요청 헬퍼 함수들
 */
export const api = {
  get: (url: string, options: RequestInit = {}) => apiRequest(url, { ...options, method: 'GET' }),

  post: <T>(url: string, data: T, options: RequestInit = {}) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(url: string, data: T, options: RequestInit = {}) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (url: string, options: RequestInit = {}) =>
    apiRequest(url, { ...options, method: 'DELETE' }),
};
