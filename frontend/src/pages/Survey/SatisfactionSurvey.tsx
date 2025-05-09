import { useState, useEffect } from 'react';
import Button from '../../components/ui/button';
import { WasteData } from '../../data/menuData';
import { API_CONFIG } from '../../config/apiConfig';

// 만족도 레벨 정의
const satisfactionLevels = [
  { id: 'veryPoor', label: '아쉬워요', value: 20 },
  { id: 'poor', label: '그럭저럭', value: 40 },
  { id: 'average', label: '보통', value: 60 },
  { id: 'good', label: '좋아요', value: 80 },
  { id: 'excellent', label: '최고예요', value: 100 },
];

// 샘플 메뉴 데이터
const sampleMenus = [
  { id: 1, name: '비빔밥' },
  { id: 2, name: '김치찌개' },
  { id: 3, name: '된장찌개' },
  { id: 4, name: '불고기' },
  { id: 5, name: '잡채' },
];

interface MenuItem {
  id: number;
  name: string;
  satisfaction: number | null;
  votes: number; // 각 만족도 레벨별 투표 수를 저장
}

const SatisfactionSurvey = () => {
  const [todayMenus, setTodayMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferenceData, setPreferenceData] = useState<WasteData[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // 오늘의 메뉴 가져오기
  useEffect(() => {
    const fetchTodayMenus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 개발 환경에서는 API 호출 대신 더미 데이터 사용
        // 실제 환경에서는 아래 주석을 해제하고 더미 데이터 부분을 주석 처리하세요
        /*
        // 현재 날짜 가져오기
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식

        // API 호출
        const response = await fetch(
          API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.MEAL.DAILY_LEFTOVER).replace('{date}', dateString)
        );

        if (!response.ok) {
          throw new Error('메뉴를 불러오는데 실패했습니다.');
        }

        const data = await response.json();

        // 메뉴 데이터 변환
        const menus: MenuItem[] = data.menus.map((menu: { id: number; name: string }) => ({
          id: menu.id,
          name: menu.name,
          satisfaction: null,
          votes: 0,
        }));

        setTodayMenus(menus);
        
        // 기본 선호도 데이터 설정
        setPreferenceData(
          menus.map((menu) => ({
            name: menu.name,
            잔반률: 50, // 기본값
          }))
        );
        */

        // 개발용 더미 데이터
        const dummyMenus: MenuItem[] = sampleMenus.map((menu: { id: number; name: string }) => ({
          id: menu.id,
          name: menu.name,
          satisfaction: null,
          votes: 0,
        }));

        setTodayMenus(dummyMenus);
        setPreferenceData(
          dummyMenus.map((menu) => ({
            name: menu.name,
            잔반률: 50, // 기본값
          }))
        );
      } catch (err) {
        console.error('메뉴를 불러오는 중 오류 발생:', err);
        setError('더미 데이터를 표시합니다.');

        // 개발용 더미 데이터
        const dummyMenus: MenuItem[] = sampleMenus.map((menu: { id: number; name: string }) => ({
          id: menu.id,
          name: menu.name,
          satisfaction: null,
          votes: 0,
        }));

        setTodayMenus(dummyMenus);
        setPreferenceData(
          dummyMenus.map((menu) => ({
            name: menu.name,
            잔반률: 50, // 기본값
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayMenus();
  }, []);

  // 만족도 선택 처리
  const handleSatisfactionChange = (menuId: number, satisfactionValue: number) => {
    if (isClosed) return; // 마감된 경우 변경 불가

    // 메뉴 목록 업데이트
    const updatedMenus = todayMenus.map((menu) => {
      if (menu.id === menuId) {
        // 투표 수 증가
        return { ...menu, satisfaction: satisfactionValue, votes: menu.votes + 1 };
      }
      return menu;
    });

    setTodayMenus(updatedMenus);
    setTotalVotes(totalVotes + 1);

    // 선호도 데이터 업데이트 (100 - 만족도 = 잔반률)
    updatePreferenceData(updatedMenus);

    // API를 통해 만족도 데이터 전송
    sendSatisfactionData(menuId, satisfactionValue);

    // 투표 후 화면 초기화 (메뉴별 만족도 선택 상태 초기화)
    setTimeout(() => {
      const resetMenus = updatedMenus.map((menu) => ({
        ...menu,
        satisfaction: null,
      }));
      setTodayMenus(resetMenus);
    }, 1000);
  };

  // API를 통해 만족도 데이터 전송
  const sendSatisfactionData = async (menuId: number, satisfactionValue: number) => {
    try {
      const selectedMenu = todayMenus.find(menu => menu.id === menuId);
      if (!selectedMenu) return;

      const payload = {
        menuId: selectedMenu.id,
        menuName: selectedMenu.name,
        satisfactionValue,
        timestamp: new Date().toISOString()
      };

      // 실제 API 엔드포인트로 대체해야 함
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SATISFACTION.VOTE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('만족도 투표 전송에 실패했습니다.');
      }

      console.log('만족도 투표가 성공적으로 전송되었습니다.');
    } catch (err) {
      console.error('만족도 투표 전송 중 오류 발생:', err);
      // 오류 처리 로직을 여기에 추가할 수 있습니다.
    }
  };

  // 선호도 데이터 업데이트
  const updatePreferenceData = (menus: MenuItem[]) => {
    // 각 메뉴별로 평균 만족도 계산
    const updatedPreferenceData = menus.map((menu) => {
      // 각 만족도 레벨별 투표 수를 계산하여 평균 구하기
      const totalSatisfaction = satisfactionLevels.reduce((acc, level) => {
        return acc + level.value * (menu.satisfaction === level.value ? 1 : 0);
      }, 0);

      const avgSatisfaction = menu.votes > 0 ? totalSatisfaction / menu.votes : 50;

      return {
        name: menu.name,
        잔반률: 100 - avgSatisfaction,
      };
    });

    setPreferenceData(updatedPreferenceData);
  };

  // 결과 마감 처리
  const handleClose = async () => {
    try {
      setIsLoading(true);

      // 마감 데이터 준비
      const submissionData = todayMenus.map((menu) => {
        const preference = preferenceData.find((item) => item.name === menu.name);
        const avgSatisfaction = preference ? 100 - preference.잔반률 : 50;

        return {
          menuId: menu.id,
          name: menu.name,
          votes: menu.votes,
          averageSatisfaction: avgSatisfaction,
        };
      });

      // API 호출
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SATISFACTION.SUBMIT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          data: submissionData,
          totalVotes: totalVotes,
        }),
      });

      if (!response.ok) {
        throw new Error('만족도 제출에 실패했습니다.');
      }

      setIsClosed(true);
      setShowConfirmation(false);
      alert('만족도 조사가 마감되었습니다.');
    } catch (err) {
      console.error('만족도 제출 중 오류 발생:', err);
      alert('만족도 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 마감 확인 모달
  const ConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">만족도 조사 마감</h3>
        <p className="mb-6">정말로 만족도 조사를 마감하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        <div className="flex justify-end space-x-3">
          <Button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            onClick={() => setShowConfirmation(false)}
          >
            취소
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleClose}
          >
            마감하기
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: 'url("/images/background/background_dashboard.png")' }}
    >
      {/* 마감 버튼을 전체 페이지 좌측 상단 모서리에 배치 */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          className={`px-6 py-2 text-sm ${
            isClosed ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-400 hover:bg-red-600'
          } text-white font-semibold rounded-2xl opacity-70 hover:opacity-100`}
          onClick={() => !isClosed && setShowConfirmation(true)}
          disabled={isClosed}
        >
          {isClosed ? '마감됨' : '관리자 마감'}
        </Button>
      </div>

      <div className="h-5xl w-full max-w-3xl rounded-lg p-8 backdrop-blur-sm relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">오늘 식사는 어떠셨나요?</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-10">로딩 중...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-xl space-y-6">
                {todayMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="bg-white bg-opacity-80 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold">{menu.name}</h3>
                      <span className="text-sm text-gray-500">{menu.votes}명 참여</span>
                    </div>
                    <div className="flex space-x-2 justify-between">
                      {satisfactionLevels.map((level) => (
                        <button
                          key={level.id}
                          className={`flex-1 p-2 rounded-md text-sm transition-colors
                            ${
                              menu.satisfaction === level.value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                            }
                            ${isClosed ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          onClick={() => handleSatisfactionChange(menu.id, level.value)}
                          disabled={isClosed}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-700">
                현재까지 <span className="font-bold">{totalVotes}</span>명이 참여했습니다.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {isClosed
                  ? '만족도 조사가 마감되었습니다.'
                  : '식단에 대한 여러분의 소중한 의견을 들려주세요!'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 마감 확인 모달 */}
      {showConfirmation && <ConfirmationModal />}
    </div>
  );
};

export default SatisfactionSurvey;
