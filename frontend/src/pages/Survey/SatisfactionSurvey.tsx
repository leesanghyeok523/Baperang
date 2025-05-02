import { useState, useEffect } from 'react';
import Button from '../../components/ui/button';
import { WasteData } from '../../data/menuData';

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

    // 투표 후 화면 초기화 (메뉴별 만족도 선택 상태 초기화)
    setTimeout(() => {
      const resetMenus = updatedMenus.map((menu) => ({
        ...menu,
        satisfaction: null,
      }));
      setTodayMenus(resetMenus);
    }, 1000);
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

      // API 호출 (실제 구현 시 아래 URL을 수정해야 합니다)
      const response = await fetch('/api/v1/satisfaction/submit', {
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
          } text-white font-semibold rounded-xl opacity-70 hover:opacity-100`}
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
                    className={`bg-white/50 rounded-2xl p-4 ${isClosed ? 'opacity-70' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-4 my-2 mx-4">
                      <h2 className="text-xl font-semibold">{menu.name}</h2>
                      <div className="text-sm text-gray-500">투표: {menu.votes}명</div>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between">
                        {satisfactionLevels.map((level) => (
                          <div key={level.id} className="flex flex-col items-center w-16">
                            <button
                              className={`w-6 h-6 rounded-full z-10 border-2 ${
                                menu.satisfaction === level.value
                                  ? 'bg-red-500 border-red-600'
                                  : 'bg-white border-gray-400'
                              }`}
                              onClick={() => handleSatisfactionChange(menu.id, level.value)}
                              disabled={isClosed}
                              aria-label={level.label}
                            />
                            <span className="mt-2 text-xs text-center">{level.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {isClosed && (
                  <div className="p-4 bg-red-100 text-red-700 rounded-lg mt-4">
                    <p className="font-bold">만족도 조사가 마감되었습니다.</p>
                    <p>오늘 총 {totalVotes}명이 참여했습니다. 감사합니다!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 마감 확인 모달 */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">만족도 조사 마감</h3>
            <p className="mb-6">
              정말로 오늘의 만족도 조사를 마감하시겠습니까?
              <br />
              마감 후에는 더 이상 참여가 불가능합니다.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-400 text-gray-800 rounded"
                onClick={() => setShowConfirmation(false)}
              >
                취소
              </Button>
              <Button
                className="px-4 py-2 bg-red-400 hover:bg-red-600 text-gray-800 rounded"
                onClick={handleClose}
              >
                마감하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SatisfactionSurvey;
