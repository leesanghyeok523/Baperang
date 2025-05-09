import { useState, useEffect } from 'react';
import Button from '../../components/ui/button';
import { WasteData } from '../../data/menuData';
import API_CONFIG from '../../config/api';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

// 만족도 레벨 정의
const satisfactionLevels = [
  { id: 'veryPoor', label: '아쉬워요', value: 20 },
  { id: 'poor', label: '그럭저럭', value: 40 },
  { id: 'average', label: '보통', value: 60 },
  { id: 'good', label: '좋아요', value: 80 },
  { id: 'excellent', label: '최고예요', value: 100 },
];

// 샘플 메뉴 데이터 (백엔드 연결 전 개발용)
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

// Calendar에서 사용하는 MenuItem 인터페이스 (API 응답 형태)
interface CalendarMenuItem {
  menuId: number;
  menuName: string;
}

// Calendar에서 사용하는 DayMenuData 인터페이스 (API 응답 형태)
interface DayMenuData {
  date: string;
  dayOfWeekName: string;
  menu: CalendarMenuItem[];
}

// Calendar에서 사용하는 MenuResponse 인터페이스 (API 응답 형태)
interface MenuResponse {
  days: DayMenuData[];
}

// <br> 태그로 구분된 메뉴명을 분리하는 함수 (Calendar에서 가져옴)
const parseMenuName = (menuName: string): string[] => {
  // <br/>, <br>, <BR/>, <BR> 등 다양한 형태의 br 태그 처리
  const regex = /<br\s*\/?>/gi;
  return menuName.split(regex).filter((item) => item.trim() !== '');
};

const SatisfactionSurvey = () => {
  const [todayMenus, setTodayMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferenceData, setPreferenceData] = useState<WasteData[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const { isAuthenticated, accessToken } = useAuthStore();

  // 오늘의 메뉴 가져오기 (Calendar API 활용)
  useEffect(() => {
    const fetchTodayMenus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 현재 날짜 정보
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
          2,
          '0'
        )}`;

        // 개발 환경 또는 인증 토큰이 없는 경우 더미 데이터 사용
        if (!isAuthenticated || !accessToken) {
          console.log('개발 환경 또는 인증되지 않은 상태 - 더미 데이터 사용');

          // 개발용 더미 데이터
          const dummyMenus: MenuItem[] = sampleMenus.map((menu) => ({
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

          setIsLoading(false);
          return;
        }

        // Calendar API를 사용하여 이번 달 메뉴 데이터 가져오기
        console.log('Calendar API 사용하여 메뉴 데이터 가져오기:', { year, month });

        const endpoint = API_CONFIG.ENDPOINTS.MEAL.MENU_CALENDAR;
        const url = API_CONFIG.getUrl(endpoint, {
          year: year.toString(),
          month: month.toString(),
        });

        // 토큰 형식 확인 및 처리
        const authHeaderValue = accessToken.startsWith('Bearer ')
          ? accessToken
          : `Bearer ${accessToken}`;

        const response = await axios.get(url, {
          headers: {
            Authorization: authHeaderValue,
            'Content-Type': 'application/json',
          },
        });

        console.log('API 응답:', response.data);

        // 오늘 날짜의 메뉴만 필터링
        const menuData: MenuResponse = response.data;
        const todayData = menuData.days?.find((day) => day.date === dateString);

        if (!todayData || !todayData.menu || todayData.menu.length === 0) {
          console.log('오늘의 메뉴 데이터가 없습니다. 더미 데이터 사용');

          // 오늘 메뉴 데이터가 없는 경우 더미 데이터 사용
          const dummyMenus: MenuItem[] = sampleMenus.map((menu) => ({
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
        } else {
          console.log('오늘의 메뉴 데이터:', todayData);

          // <br> 태그로 분리된 메뉴명 처리
          const processedMenus: MenuItem[] = [];

          todayData.menu.forEach((item) => {
            if (item.menuName) {
              // <br> 태그로 분리
              const parsedItems = parseMenuName(item.menuName);

              // 각 메뉴를 개별 항목으로 추가
              parsedItems.forEach((name, index) => {
                processedMenus.push({
                  id: item.menuId * 100 + index, // 고유 ID 생성 (원본 ID * 100 + 인덱스)
                  name: name.trim(),
                  satisfaction: null,
                  votes: 0,
                });
              });
            }
          });

          console.log('처리된 메뉴 데이터:', processedMenus);

          setTodayMenus(processedMenus);
          setPreferenceData(
            processedMenus.map((menu) => ({
              name: menu.name,
              잔반률: 50, // 기본값
            }))
          );
        }
      } catch (err) {
        console.error('메뉴를 불러오는 중 오류 발생:', err);
        setError('더미 데이터를 표시합니다.');

        // 오류 발생 시 더미 데이터 사용
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
  }, [isAuthenticated, accessToken]);

  // 만족도 선택 처리 (개발용 로컬 처리)
  const handleSatisfactionChange = async (menuId: number, satisfactionValue: number) => {
    if (isClosed) return; // 마감된 경우 변경 불가

    try {
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
      const updatedPreferenceData = updatePreferenceData(updatedMenus);
      setPreferenceData(updatedPreferenceData);

      // 개발용 로그
      console.log('만족도 투표 데이터:', {
        menuId,
        menuName: updatedMenus.find((m) => m.id === menuId)?.name,
        satisfactionValue,
        timestamp: new Date().toISOString(),
      });

      // 투표 후 화면 초기화 (메뉴별 만족도 선택 상태 초기화)
      setTimeout(() => {
        const resetMenus = updatedMenus.map((menu) => ({
          ...menu,
          satisfaction: null,
        }));
        setTodayMenus(resetMenus);
      }, 1000);
    } catch (error) {
      console.error('만족도 처리 중 오류 발생:', error);
      // 오류 처리
    }
  };

  // 선호도 데이터 업데이트
  const updatePreferenceData = (menus: MenuItem[]): WasteData[] => {
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

    return updatedPreferenceData;
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

      // 개발용 로그
      console.log('만족도 마감 데이터:', {
        date: new Date().toISOString().split('T')[0],
        data: submissionData,
        totalVotes: totalVotes,
        isClosed: true,
      });

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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
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
