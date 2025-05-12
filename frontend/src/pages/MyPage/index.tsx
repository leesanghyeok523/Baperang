import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../utils/apiClient';
import API_CONFIG from '../../config/api';

const MyPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 사용자 데이터로 초기화
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    confirmPassword: '',
    nutritionistName: '',
    city: '',
    schoolName: '',
  });

  const navigate = useNavigate();

  // 사용자 정보 로드
  useEffect(() => {
    if (user) {
      setFormData({
        loginId: user.loginId || '',
        password: '',
        confirmPassword: '',
        nutritionistName: user.nutritionistName || '',
        city: user.city || '',
        schoolName: user.schoolName || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    // 비밀번호 확인
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 필요한 데이터만 전송
      const updateData = {
        nutritionistName: formData.nutritionistName,
        city: formData.city,
        schoolName: formData.schoolName,
      };

      // 비밀번호가 입력된 경우에만 포함
      if (formData.password) {
        Object.assign(updateData, { password: formData.password });
      }

      // 사용자 정보 업데이트 요청
      const response = await apiClient.put(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.USER_INFO, {
          'user-id': user?.userPk.toString() || '',
        }),
        updateData
      );

      if (!response.ok) {
        throw new Error('회원 정보 수정에 실패했습니다');
      }

      alert('회원 정보가 수정되었습니다.');
    } catch (error) {
      console.error('회원 정보 수정에 실패했습니다:', error);
      alert('회원 정보 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // 로그아웃 API 호출
      await apiClient.post(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT),
        {} // 빈 객체를 두 번째 인자로 전달
      );

      // 로그아웃 처리 (상태 초기화)
      logout();

      // 홈페이지로 이동
      navigate('/');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
      // 오류가 발생해도 로컬 상태는 로그아웃 처리
      logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex items-center justify-center
        bg-mypage
        bg-cover
        bg-center
      "
    >
      <div className="w-full mt-10 max-w-sm space-y-5 h-[65vh]">
        <InputCard
          placeholder="이름을 입력하세요"
          name="nutritionistName"
          value={formData.nutritionistName}
          onChange={handleChange}
        />

        <InputCard
          placeholder="학교명을 입력하세요"
          name="schoolName"
          value={formData.schoolName}
          onChange={handleChange}
        />

        <InputCard
          placeholder="지역을 입력하세요"
          name="city"
          value={formData.city}
          onChange={handleChange}
        />

        <InputCard
          placeholder="아이디를 입력하세요"
          name="loginId"
          value={formData.loginId}
          onChange={handleChange}
          disabled // 아이디는 변경 불가능하도록 설정
        />

        <InputCard
          type="password"
          placeholder="비밀번호를 입력하세요"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />

        <InputCard
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        <div className="flex justify-center gap-4">
          <Button
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-red-500 hover:text-white"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Button>
          <Button className="w-full max-w-[200px] py-3" onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? '수정 중...' : '수정하기'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
