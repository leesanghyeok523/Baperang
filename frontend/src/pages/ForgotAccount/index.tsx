import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/button';
import InputCard from '../../components/ui/inputcard';
import API_CONFIG from '../../config/api';
import Header from '../../components/Header';

type TabType = 'findId' | 'resetPassword';

const ForgotAccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('findId');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundId, setFoundId] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const navigate = useNavigate();

  // 아이디 찾기 폼 상태
  const [findIdForm, setFindIdForm] = useState({
    nutritionistName: '',
    city: '',
    schoolName: '',
  });

  // 비밀번호 재설정 폼 상태
  const [resetPasswordForm, setResetPasswordForm] = useState({
    loginId: '',
    nutritionistName: '',
    city: '',
    schoolName: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 입력 필드 변경 핸들러 - 아이디 찾기
  const handleFindIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFindIdForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setFoundId('');
  };

  // 입력 필드 변경 핸들러 - 비밀번호 재설정
  const handleResetPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResetPasswordForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setPasswordResetSuccess(false);
  };

  // 아이디 찾기 제출
  const handleFindIdSubmit = async () => {
    // 필수 필드 검증
    if (!findIdForm.nutritionistName || !findIdForm.city || !findIdForm.schoolName) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // API 요청 준비
      console.log('아이디 찾기 요청 데이터:', findIdForm);
      const findIdUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.FIND_ID);

      // 백엔드로 요청 전송
      const response = await fetch(findIdUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(findIdForm),
      });

      console.log('아이디 찾기 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류 응답:', errorText);
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('아이디 찾기 응답 데이터:', data);

      setFoundId(data.loginId);
    } catch (error) {
      console.error('아이디 찾기 오류:', error);
      setError('입력한 정보와 일치하는 계정을 찾을 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 재설정 제출
  const handleResetPasswordSubmit = async () => {
    // 필수 필드 검증
    const { loginId, nutritionistName, city, schoolName, newPassword, confirmPassword } =
      resetPasswordForm;

    if (!loginId || !nutritionistName || !city || !schoolName || !newPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 비밀번호 확인은 제외하고 API에 전송할 데이터 준비
      const requestData = {
        loginId,
        nutritionistName,
        city,
        schoolName,
        newPassword,
      };

      console.log('비밀번호 재설정 요청 데이터:', requestData);
      const resetPasswordUrl = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH.NEW_PASSWORD);

      // 백엔드로 요청 전송
      const response = await fetch(resetPasswordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      console.log('비밀번호 재설정 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 오류 응답:', errorText);
        throw new Error(`서버 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('비밀번호 재설정 응답 데이터:', data);

      setPasswordResetSuccess(true);
      // 폼 초기화
      setResetPasswordForm({
        loginId: '',
        nutritionistName: '',
        city: '',
        schoolName: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      setError('입력한 정보와 일치하는 계정을 찾을 수 없거나 비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header isLoggedIn={false} />
      <div
        className="
          min-h-screen
          flex items-center justify-center
          bg-join
          bg-cover
          bg-center
          relative
        "
      >
        <div className="w-full max-w-sm space-y-6 relative z-50">
          {/* <h1 className="text-4xl font-semibold text-gray-700 text-center mb-6">
            {activeTab === 'findId' ? '아이디 찾기' : '비밀번호 재설정'}
          </h1> */}

          {/* 탭 전환 버튼 */}
          <div className="flex border-b border-gray-300 mb-6 relative z-50">
            <button
              className={`flex-1 py-3 font-medium cursor-pointer relative ${
                activeTab === 'findId'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-green-500'
              }`}
              onClick={() => setActiveTab('findId')}
              type="button"
            >
              아이디 찾기
            </button>
            <button
              className={`flex-1 py-3 font-medium cursor-pointer relative ${
                activeTab === 'resetPassword'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-green-500'
              }`}
              onClick={() => setActiveTab('resetPassword')}
              type="button"
            >
              비밀번호 재설정
            </button>
          </div>

          {/* 아이디 찾기 폼 */}
          {activeTab === 'findId' && (
            <div className="space-y-4">
              <InputCard
                placeholder="영양사 이름을 입력하세요"
                name="nutritionistName"
                value={findIdForm.nutritionistName}
                onChange={handleFindIdChange}
              />
              <InputCard
                placeholder="도시를 입력하세요"
                name="city"
                value={findIdForm.city}
                onChange={handleFindIdChange}
              />
              <InputCard
                placeholder="학교 이름을 입력하세요"
                name="schoolName"
                value={findIdForm.schoolName}
                onChange={handleFindIdChange}
              />

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              {foundId && (
                <div className="bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg">
                  <p className="text-center">
                    찾은 아이디: <strong>{foundId}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-6">
                <Button
                  className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
                  onClick={() => navigate('/login')}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  className="w-full max-w-[200px] py-3"
                  onClick={handleFindIdSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '아이디 찾기'}
                </Button>
              </div>
            </div>
          )}

          {/* 비밀번호 재설정 폼 */}
          {activeTab === 'resetPassword' && (
            <div className="space-y-4">
              <InputCard
                placeholder="아이디를 입력하세요"
                name="loginId"
                value={resetPasswordForm.loginId}
                onChange={handleResetPasswordChange}
              />
              <InputCard
                placeholder="영양사 이름을 입력하세요"
                name="nutritionistName"
                value={resetPasswordForm.nutritionistName}
                onChange={handleResetPasswordChange}
              />
              <InputCard
                placeholder="도시를 입력하세요"
                name="city"
                value={resetPasswordForm.city}
                onChange={handleResetPasswordChange}
              />
              <InputCard
                placeholder="학교 이름을 입력하세요"
                name="schoolName"
                value={resetPasswordForm.schoolName}
                onChange={handleResetPasswordChange}
              />
              <InputCard
                type="password"
                placeholder="새 비밀번호를 입력하세요"
                name="newPassword"
                value={resetPasswordForm.newPassword}
                onChange={handleResetPasswordChange}
              />
              <InputCard
                type="password"
                placeholder="새 비밀번호를 다시 입력하세요"
                name="confirmPassword"
                value={resetPasswordForm.confirmPassword}
                onChange={handleResetPasswordChange}
              />

              {error && <div className="text-red-500 text-sm text-center">{error}</div>}

              {passwordResetSuccess && (
                <div className="bg-green-100 border border-green-300 text-green-700 p-4 rounded-lg">
                  <p className="text-center">비밀번호가 성공적으로 재설정되었습니다.</p>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-6">
                <Button
                  className="w-full max-w-[200px] py-3 bg-white/50 hover:bg-green-500 hover:text-white"
                  onClick={() => navigate('/login')}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  className="w-full max-w-[200px] py-3"
                  onClick={handleResetPasswordSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '비밀번호 재설정'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotAccountPage;
