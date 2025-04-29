import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';
import { userData } from '../../data/dummyData';

const MyPage: React.FC = () => {
  // 더미 데이터로 초기화
  const [formData, setFormData] = useState({
    ...userData,
    confirmPassword: userData.password, // 비밀번호 확인 필드
  });

  const navigate = useNavigate();

  // 페이지 접근 시 로그인 상태 확인 (더미 데이터 사용 시에는 무조건 true)
  // 실제 로그인 구현 후에는 주석 해제
  /*
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);
  */

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

    // 로그인 기능이 구현되면 아래 API 호출 코드 활성화
    // try {
    //   const token = localStorage.getItem('token'); // 또는 getToken() 사용
    //
    //   if (!token) {
    //     navigate('/login');
    //     return;
    //   }
    //
    //   // 필요한 데이터만 전송
    //   const updateData = {
    //     nutritionistName: formData.nutritionistName,
    //     city: formData.city,
    //     schoolName: formData.schoolName,
    //   };
    //
    //   // 비밀번호가 입력된 경우에만 포함
    //   if (formData.password) {
    //     updateData.password = formData.password;
    //   }
    //
    //   // 사용자 정보 업데이트 요청
    //   await axios.put('/api/v1/members/me', updateData, {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   });
    //
    //   alert('회원 정보가 수정되었습니다.');
    // } catch (err) {
    //   console.error('회원 정보 수정에 실패했습니다:', err);
    //   alert('회원 정보 수정에 실패했습니다. 다시 시도해주세요.');
    // }

    // 임시 처리
    alert('회원 정보가 수정되었습니다. (로그인 기능 구현 전 테스트)');
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
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-4xl font-semibold text-gray-700 text-center mb-10">마이페이지</h1>

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
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
            onClick={() => navigate(-1)}
          >
            취소
          </Button>
          <Button className="w-full max-w-[200px] py-3" onClick={handleUpdate}>
            수정하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
