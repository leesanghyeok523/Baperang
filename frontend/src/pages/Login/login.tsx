// src/pages/Login/index.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';

const LoginPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: 로그인 로직
    console.log({ userId, password });
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

        <div className="flex justify-center">
          <a href="/forgot" className="text-sm text-gray-600 hover:underline">
            아이디/비밀번호를 잊으셨나요?
          </a>
        </div>

        <div className="flex justify-center gap-4">
          <Button className="w-full max-w-[200px] py-3" onClick={handleLogin}>
            로그인
          </Button>
          <Button
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
            onClick={() => navigate('/join')}
          >
            회원가입
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
