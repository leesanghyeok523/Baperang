import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';

const JoinPage: React.FC = () => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    // TODO: 회원가입 로직
    console.log({ name, userId, password, confirmPassword, school });
  };

  return (
    <div
      className="
        min-h-screen
        flex items-center justify-center
        bg-join
        bg-cover
        bg-center
      "
    >
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-4xl font-semibold text-gray-700 text-center mb-10">회원가입</h1>

        <InputCard
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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

        <InputCard
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <InputCard
          placeholder="학교명을 입력하세요"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />

        <div className="flex justify-center gap-4">
          <Button className="w-full max-w-[200px] py-3" onClick={handleJoin}>
            가입하기
          </Button>
          <Button
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
            onClick={() => navigate('/login')}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
