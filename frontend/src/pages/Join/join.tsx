import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';
import API_CONFIG from '../../config/api';

const JoinPage: React.FC = () => {
  // 사용자 입력값 상태
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    confirmPassword: '',
    nutritionistName: '',
    city: '',
    schoolName: '',
  });

  // 유효성 검사 및 오류 메시지
  const [errors, setErrors] = useState({
    loginId: '',
    password: '',
    confirmPassword: '',
    nutritionistName: '',
    city: '',
    schoolName: '',
  });

  // 아이디 중복 확인 상태
  const [idCheckLoading, setIdCheckLoading] = useState(false);
  const [idChecked, setIdChecked] = useState(false);

  const navigate = useNavigate();

  // 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 아이디 필드가 변경되면 중복 확인 상태 초기화
    if (name === 'loginId' && idChecked) {
      setIdChecked(false);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 필드가 변경되면 해당 필드의 오류 메시지 초기화
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // 아이디 중복 확인 함수
  const checkIdDuplicate = async () => {
    if (!formData.loginId || formData.loginId.length < 5) {
      setErrors((prev) => ({
        ...prev,
        loginId: '아이디는 최소 5자 이상이어야 합니다.',
      }));
      return;
    }

    setIdCheckLoading(true);

    try {
      // 요청 데이터 출력
      const requestData = { loginId: formData.loginId };
      console.log('중복 확인 요청 데이터:', requestData);

      // 아이디 중복 확인 API 호출
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.VALIDATE_ID), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: formData.loginId }),
      });

      // 응답이 HTML인지 확인
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('HTML 응답 수신됨 - API 경로 문제 가능성 있음');
        throw new Error('서버가 유효한 JSON 응답을 반환하지 않습니다');
      }

      console.log('중복 확인 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류 응답:', errorText);
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('중복 확인 응답 데이터:', data);

      // 백엔드 응답 형식에 맞게 처리
      if (data.valid) {
        setIdChecked(true);
        alert('사용 가능한 아이디입니다.');
      } else {
        setErrors((prev) => ({
          ...prev,
          loginId: '이미 사용 중인 아이디입니다.',
        }));
      }
    } catch (error) {
      console.error('아이디 중복 확인 중 오류:', error);
      setErrors((prev) => ({
        ...prev,
        loginId: '중복 확인 중 오류가 발생했습니다.',
      }));
    } finally {
      setIdCheckLoading(false);
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // 아이디 검사
    if (!formData.loginId) {
      newErrors.loginId = '아이디를 입력해주세요.';
      isValid = false;
    } else if (!idChecked) {
      newErrors.loginId = '아이디 중복 확인이 필요합니다.';
      isValid = false;
    }

    // 비밀번호 검사
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
      isValid = false;
    } else if (formData.password.length < 4) {
      newErrors.password = '비밀번호는 최소 4자 이상이어야 합니다.';
      isValid = false;
    }

    // 비밀번호 확인 검사
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      isValid = false;
    }

    // 영양사 이름 검사
    if (!formData.nutritionistName) {
      newErrors.nutritionistName = '영양사 이름을 입력해주세요.';
      isValid = false;
    }

    // 도시 검사
    if (!formData.city) {
      newErrors.city = '도시를 입력해주세요.';
      isValid = false;
    }

    // 학교 이름 검사
    if (!formData.schoolName) {
      newErrors.schoolName = '학교 이름을 입력해주세요.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // 회원가입 처리
  const handleJoin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // 요청 데이터 준비
      const requestData = {
        loginId: formData.loginId,
        password: formData.password,
        nutritionistName: formData.nutritionistName,
        city: formData.city,
        schoolName: formData.schoolName,
      };
      console.log('회원가입 요청 데이터:', requestData);

      // 회원가입 API 호출
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      console.log('회원가입 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류 응답:', errorText);
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('회원가입 응답 데이터:', data);

      // 성공 시 로그인 페이지로 이동
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      alert(
        error instanceof Error
          ? error.message
          : '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    }
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
        <h1 className="text-4xl font-semibold text-gray-700 text-center mb-6">회원가입</h1>

        <InputCard
          placeholder="아이디를 입력하세요"
          name="loginId"
          value={formData.loginId}
          onChange={handleChange}
          error={errors.loginId}
          showCheckButton
          onCheck={checkIdDuplicate}
          checkLoading={idCheckLoading}
          checked={idChecked}
        />

        <InputCard
          type="password"
          placeholder="비밀번호를 입력하세요"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <InputCard
          type="password"
          placeholder="비밀번호를 다시 입력하세요"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <InputCard
          placeholder="영양사 이름을 입력하세요"
          name="nutritionistName"
          value={formData.nutritionistName}
          onChange={handleChange}
          error={errors.nutritionistName}
        />

        <InputCard
          placeholder="도시를 입력하세요"
          name="city"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
        />

        <InputCard
          placeholder="학교 이름을 입력하세요"
          name="schoolName"
          value={formData.schoolName}
          onChange={handleChange}
          error={errors.schoolName}
        />

        <div className="flex justify-center gap-4 mt-8">
          <Button
            className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
            onClick={() => navigate('/login')}
          >
            취소
          </Button>
          <Button className="w-full max-w-[200px] py-3" onClick={handleJoin}>
            가입하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
