import { useState, useEffect } from 'react';
import MenuCard from '../../components/MainMenuCard';
import RateToggleCard from '../../components/RateToggle';
import { defaultMenu, defaultWasteData, WasteData } from '../../data/menuData';
import API_CONFIG from '../../config/api';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

// 백엔드 API 응답 타입 정의
interface MenuItem {
  menuId: number;
  menuName: string;
}

interface DayData {
  date: string;
  dayOfWeekName: string;
  menu: MenuItem[];
}

interface ApiResponse {
  days: DayData[];
}

// br 태그로 분리된 메뉴 이름을 배열로 분리하는 함수
const parseMenuName = (menuName: string): string[] => {
  // <br/>, <br>, <BR/>, <BR> 등 다양한 형태의 br 태그 처리
  const regex = /<br\s*\/?>/gi;
  return menuName.split(regex).filter((item) => item.trim() !== '');
};

const MainPage = () => {
  // 현재 날짜 기준으로 초기화
  const today = new Date();
  const initialDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(today.getDate()).padStart(2, '0')}`;

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentMenuItems, setCurrentMenuItems] = useState<string[]>(defaultMenu);
  const [loading, setLoading] = useState(false);

  // 잔반률 데이터는 항상 오늘 날짜의 데이터 사용
  const [todayWasteData, setTodayWasteData] = useState<WasteData[]>(defaultWasteData);

  // 일별 메뉴 데이터 가져오기
  const fetchDailyMenu = async (dateStr: string) => {
    try {
      setLoading(true);
      const { accessToken } = useAuthStore.getState();

      console.log('fetchDailyMenu 호출됨', { dateStr });

      if (!accessToken) {
        console.error('인증 토큰이 없습니다. 로그인이 필요합니다.');
        return;
      }

      console.log('인증 토큰:', accessToken.substring(0, 20) + '...');

      // API 엔드포인트는 API_CONFIG에서 확인하고 적절히 수정
      const endpoint = API_CONFIG.ENDPOINTS.MEAL.MENU_CALENDAR;

      // 날짜 파라미터 형식 조정 (API 명세에 맞게)
      const [year, month, day] = dateStr.split('-');
      const url = API_CONFIG.getUrl(endpoint, {
        year: year,
        month: month,
      });

      console.log('API 요청 URL:', url);

      // 토큰 형식 확인 및 처리
      const authHeaderValue = accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`;

      console.log('요청 헤더:', {
        Authorization: authHeaderValue.substring(0, 20) + '...',
        'Content-Type': 'application/json',
      });

      const response = await axios.get<ApiResponse>(url, {
        headers: {
          Authorization: authHeaderValue,
          'Content-Type': 'application/json',
        },
      });

      console.log('API 응답:', response.data);

      // 날짜 포맷을 항상 2자리로 맞추기
      const paddedDateStr = `${year.padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;

      console.log('찾는 날짜:', paddedDateStr);
      console.log(
        '응답의 전체 날짜들:',
        response.data.days.map((d) => d.date)
      );

      const dayData = response.data.days.find((d) => d.date === paddedDateStr);

      // 응답에 해당 날짜의 데이터가 없는 경우
      if (!dayData || !dayData.menu || dayData.menu.length === 0) {
        console.log('해당 날짜의 메뉴 데이터가 없음');
        setCurrentMenuItems(defaultMenu);
        return;
      }

      console.log('사용할 dayData:', dayData);

      if (dayData && dayData.menu && dayData.menu.length > 0) {
        console.log(
          '원본 메뉴:',
          dayData.menu.map((m) => m.menuName)
        );

        // <br/> 태그로 분리하여 메뉴 항목으로 처리
        const allMenuItems: string[] = [];

        dayData.menu.forEach((menu) => {
          if (menu.menuName) {
            // <br/> 태그로 분리
            const parsedItems = parseMenuName(menu.menuName);
            allMenuItems.push(...parsedItems);
          }
        });

        console.log('분리된 메뉴 항목들:', allMenuItems);

        // 메뉴가 있는 경우에만 설정
        if (allMenuItems.length > 0) {
          setCurrentMenuItems(allMenuItems);

          // 임시 잔반률 데이터 생성 (실제 API에 잔반률 데이터가 있다면 그것을 사용)
          if (paddedDateStr === todayKey) {
            const wasteData = allMenuItems.map((name) => ({
              name,
              잔반률: Math.floor(Math.random() * 7) * 5 + 5, // 5~35% 5단위 (임시)
            }));
            setTodayWasteData(wasteData);
          }
        } else {
          console.log('메뉴 항목이 없어 기본 메뉴로 설정');
          setCurrentMenuItems(defaultMenu);
        }
      } else {
        console.log('해당 날짜의 메뉴 데이터가 없음:', paddedDateStr);
        setCurrentMenuItems(defaultMenu);
      }
    } catch (error) {
      console.error('메뉴 데이터 가져오기 오류:', error);
      // 에러 상세 정보 출력
      if (axios.isAxiosError(error)) {
        console.error('API 요청 오류 상세:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }

      // 오류 발생 시 기본 메뉴 설정
      setCurrentMenuItems(defaultMenu);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 오늘 날짜의 데이터 가져오기
  useEffect(() => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(currentDate.getDate()).padStart(2, '0')}`;
    fetchDailyMenu(dateStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜 변경 시 메뉴 데이터 업데이트
  useEffect(() => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(currentDate.getDate()).padStart(2, '0')}`;
    fetchDailyMenu(dateStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // 이전/다음 날짜 이동
  const goToPrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0 bg-main bg-cover bg-center"></div>

      {/* 메인 컨텐츠 */}
      <div
        className="relative z-10 flex items-center justify-evenly"
        style={{ height: 'calc(100vh - 80px)', marginTop: '75px' }}
      >
        <div className="w-[85%] mx-auto">
          <div className="grid grid-cols-12 gap-14 w-full">
            {/* 식단 카드 */}
            <div className="col-span-12 md:col-span-4">
              <MenuCard
                menuItems={currentMenuItems}
                currentDate={currentDate}
                onPrevDay={goToPrevDay}
                onNextDay={goToNextDay}
                loading={loading}
              />
            </div>

            {/* 실시간 잔반률/선호도 전환 카드 - 항상 오늘 날짜 데이터 사용 */}
            <div className="col-span-12 md:col-span-8">
              <RateToggleCard data={todayWasteData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
