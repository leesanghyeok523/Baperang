import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import API_CONFIG from '../config/api';
import { api } from '../utils/apiClient';

/**
 * 인증 관련 기능을 제공하는 커스텀 훅
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, logout } = useAuthStore();

  /**
   * 로그인 처리
   */
  const handleLogin = async (loginId: string, password: string) => {
    try {
      await login({ loginId, password });
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  };

  /**
   * 로그아웃 처리
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /**
   * 사용자 정보 가져오기
   */
  const getUserInfo = async () => {
    if (!isAuthenticated || !user) return null;

    try {
      const response = await api.get(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.USER_INFO, {
          'user-id': user.userPk.toString(),
        })
      );

      if (!response.ok) throw new Error('사용자 정보를 가져오는데 실패했습니다');

      return await response.json();
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  };

  // 인증 상태 확인
  useEffect(() => {
    // 인증이 필요한 페이지에서 로그인 상태가 아니면 로그인 페이지로 리다이렉트
    // 이 코드는 보호된 라우트에서 사용할 때만 활성화
    // if (requireAuth && !isAuthenticated && !isLoading) {
    //   navigate('/login');
    // }
  }, [isAuthenticated, isLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    getUserInfo,
  };
};
