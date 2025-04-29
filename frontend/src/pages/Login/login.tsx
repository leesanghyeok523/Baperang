// src/pages/Login/index.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';
import { userData } from '../../data/dummyData';

interface LoginPageProps {
  onLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // 간단한 유효성 검사
    if (!userId || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    // 더미 데이터와 비교하여 로그인 처리
    if (userId === userData.loginId && password === userData.password) {
      // 로그인 성공
      setError('');
      console.log('로그인 성공:', { userId, password });

      // 로그인 성공 처리
      if (onLogin) {
        onLogin();
      }

      // 메인 페이지로 이동
      navigate('/main');
    } else {
      // 로그인 실패
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
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
      <div className="w-full max-w-sm space-y-6">
        <div className="h-28 bg-logo bg-contain bg-no-repeat bg-center"></div>

        <InputCard
          placeholder="아이디를 입력하세요"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <InputCard
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        <div className="flex justify-center">
          <a href="/forgot" className="text-sm text-gray-600 hover:underline">
            아이디/비밀번호를 잊으셨나요?
          </a>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
            onClick={() => navigate('/join')}
          >
            회원가입
          </Button>
          <Button className="w-full max-w-[200px] py-3" onClick={handleLogin}>
            로그인
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
