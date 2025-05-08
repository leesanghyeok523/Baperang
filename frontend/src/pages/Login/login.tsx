// src/pages/Login/index.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';
import useAuth from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { handleLogin, error: authError } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 입력할 때 에러 메시지 초기화
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    // 폼 제출 시 페이지 새로고침 방지
    if (e) e.preventDefault();

    // 간단한 유효성 검사
    if (!formData.loginId || !formData.password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await handleLogin(formData);
      // 에러가 없다면 useAuth 내부에서 자동으로 리다이렉트됨
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex items-center justify-center
        bg-login
        bg-cover
        bg-center
      "
    >
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="h-28 bg-logo bg-contain bg-no-repeat bg-center"></div>

        <InputCard
          placeholder="아이디를 입력하세요"
          name="loginId"
          value={formData.loginId}
          onChange={handleChange}
        />

        <InputCard
          type="password"
          placeholder="비밀번호를 입력하세요"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />

        {(error || authError) && (
          <div className="text-red-500 text-sm text-center">{error || authError}</div>
        )}

        <div className="flex justify-center">
          <Link to="/forgot" className="text-sm text-gray-600 hover:underline">
            아이디/비밀번호를 잊으셨나요?
          </Link>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            type="button"
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
            onClick={() => navigate('/join')}
            disabled={isLoading}
          >
            회원가입
          </Button>
          <Button type="submit" className="w-full max-w-[200px] py-3" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
