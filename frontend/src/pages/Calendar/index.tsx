import { useState, useEffect } from 'react';
import { downloadMenuExcel } from './excelDownloader';
import { createCalendarDays, isWorkday, CalendarDay } from './calendarUtils';
import CalendarHeader from '../../components/Calendar/Header';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import MonthlyWasteChart from '../../components/Calendar/MonthlyWasteChart';
import DishWasteRates from '../../components/Calendar/DishWasteRates';
import MenuDetail from '../../components/Calendar/MenuDetail';
import API_CONFIG from '../../config/api';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  MenuItem,
  DayMenuData,
  MenuResponse,
  MenuDataType,
  DailyWasteRate,
  DishWasteRate,
  ChartClickData,
} from '../../types/types';

// br 태그로 분리된 메뉴 이름을 배열로 분리하는 함수
const parseMenuName = (menuName: string): string[] => {
  // <br/>, <br>, <BR/>, <BR> 등 다양한 형태의 br 태그 처리
  const regex = /<br\s*\/?>/gi;
  return menuName.split(regex).filter((item) => item.trim() !== '');
};

// 백엔드 응답을 파싱하는 함수
const parseMenuResponse = (rawData: unknown): MenuResponse => {
  const days: DayMenuData[] = [];

  try {
    // 정상적인 days 배열이 있는 경우
    if (rawData && typeof rawData === 'object' && 'days' in rawData) {
      return rawData as MenuResponse; // 이미 적절한 형태로 가정
    }

    // 데이터가 배열인 경우
    else if (Array.isArray(rawData)) {
      rawData.forEach((item) => {
        if (item && typeof item === 'object' && 'date' in item) {
          days.push(item as DayMenuData);
        }
      });
    }
    // 데이터가 문자열인 경우 (HTML 태그 포함)
    else if (typeof rawData === 'string') {
      // 문자열을 하나의 메뉴 항목으로 취급
      days.push({
        date: new Date().toISOString().split('T')[0], // 오늘 날짜
        dayOfWeekName: ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()],
        menu: [
          {
            menuId: 1000,
            menuName: rawData.trim(),
          },
        ],
      });
    }
    // 데이터가 없는 경우 빈 배열 반환
    else {
      console.log('메뉴 데이터가 없습니다.');
      // 빈 days 배열 반환 (days는 이미 빈 배열로 초기화됨)
    }
  } catch (error) {
    console.error('메뉴 데이터 파싱 오류:', error);
  }

  return { days };
};

const Calendar = () => {
  // 현재 날짜 기준으로 초기화
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showWasteChart, setShowWasteChart] = useState(false); // 잔반률 차트 표시 여부
  const [selectedDayWaste, setSelectedDayWaste] = useState<DishWasteRate[] | null>(null); // 선택된 날짜의 반찬별 잔반률
  const [menuData, setMenuData] = useState<MenuDataType>({});
  const [loading, setLoading] = useState(false);

  // 월간 잔반률 데이터 상태 추가
  const [monthlyWasteData, setMonthlyWasteData] = useState<DailyWasteRate[]>([]);

  // 화면에 표시할 년월 문자열
  const displayYearMonth = `${selectedYear}년 ${selectedMonth + 1}월`;

  // 월 이동 함수
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setSelectedDate(null);
    setSelectedDayWaste(null);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setSelectedDate(null);
    setSelectedDayWaste(null);
  };

  // API에서 메뉴 데이터 가져오기
  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const { accessToken } = useAuthStore.getState();

      console.log('fetchMenuData 호출됨', { year: selectedYear, month: selectedMonth + 1 });

      if (!accessToken) {
        console.error('인증 토큰이 없습니다. 로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('인증 토큰:', accessToken.substring(0, 20) + '...');

      const endpoint = API_CONFIG.ENDPOINTS.MEAL.MENU_CALENDAR;
      const url = API_CONFIG.getUrl(endpoint, {
        year: selectedYear.toString(),
        month: (selectedMonth + 1).toString(),
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

      const response = await axios.get(url, {
        headers: {
          Authorization: authHeaderValue,
          'Content-Type': 'application/json',
        },
      });

      console.log('API 응답:', response.data);

      // 응답 데이터 파싱
      const parsedData = parseMenuResponse(response.data);
      console.log('파싱된 데이터:', parsedData);

      // 메뉴 데이터 변환
      const newMenuData: MenuDataType = {};
      parsedData.days.forEach((dayData) => {
        if (dayData.date) {
          // <br/> 태그로 분리하여 메뉴 항목으로 처리
          const allMenuItems: string[] = [];

          dayData.menu.forEach((menu) => {
            if (menu.menuName) {
              // <br/> 태그로 분리
              const parsedItems = parseMenuName(menu.menuName);
              allMenuItems.push(...parsedItems);
            }
          });

          // 잔반률 데이터 생성 (실제 데이터가 없으므로 임시로 생성)
          const wasteData = allMenuItems.map((name) => ({
            name,
            잔반률: Math.floor(Math.random() * 7) * 5 + 5, // 5~35% 5단위 (임시)
          }));

          newMenuData[dayData.date] = {
            date: `${parseInt(dayData.date.split('-')[1])}월 ${parseInt(
              dayData.date.split('-')[2]
            )}일`,
            menu: allMenuItems,
            wasteData: wasteData,
          };
        }
      });

      console.log('변환된 메뉴 데이터:', newMenuData);
      console.log('메뉴 데이터 키:', Object.keys(newMenuData));

      setMenuData(newMenuData);
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
    } finally {
      setLoading(false);
    }
  };

  // 연도나 월이 변경될 때마다 API에서 데이터 가져오기
  useEffect(() => {
    fetchMenuData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  // 달력의 주 수 계산
  const calculateWeeks = (days: CalendarDay[]) => {
    const totalDays = days.length;
    return Math.ceil(totalDays / 7);
  };

  // 해당 월의 달력 날짜 생성
  const days = createCalendarDays(selectedYear, selectedMonth, menuData);
  const weeksCount = calculateWeeks(days);

  const handleDateClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    setSelectedDate(dateStr in menuData ? dateStr : null);
    setSelectedDayWaste(null); // 새 날짜 선택 시 반찬별 잔반률 초기화
  };

  const handleExcelDownload = () => {
    downloadMenuExcel(selectedYear, selectedMonth, menuData);
  };

  // 월간 잔반률 데이터 생성
  const generateMonthlyWasteData = (): DailyWasteRate[] => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    // 모든 날짜에 대한 데이터 생성
    const allDaysData = Array(daysInMonth)
      .fill(null)
      .map((_, i) => {
        const day = i + 1;

        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
          day
        ).padStart(2, '0')}`;

        // 평일(근무일)인 경우에만 데이터 생성
        if (isWorkday(dateStr)) {
          // 해당 날짜에 메뉴가 있는 경우 잔반률 데이터 확인
          if (dateStr in menuData) {
            // 해당 날짜의 wasteData가 있으면 평균 잔반률 계산
            if (menuData[dateStr].wasteData) {
              const avgWasteRate =
                menuData[dateStr].wasteData!.reduce((sum, item) => sum + item.잔반률, 0) /
                menuData[dateStr].wasteData!.length;

              return {
                date: dateStr,
                day,
                wasteRate: Math.round(avgWasteRate),
              };
            }
          }

          // 메뉴가 없거나 잔반률 데이터가 없는 경우
          return {
            date: dateStr,
            day,
            wasteRate: null as unknown as number,
          };
        }

        // 주말이나 공휴일은 배열에서 완전히 제외 (반환하지 않음)
        return null;
      })
      .filter((item) => item !== null) as DailyWasteRate[]; // null 항목 제거

    return allDaysData;
  };

  // 월이 변경될 때마다 잔반률 데이터 생성
  useEffect(() => {
    // 주말과 공휴일을 제외한 데이터
    const newData = generateMonthlyWasteData();
    setMonthlyWasteData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, menuData]);

  // 반찬별 잔반률 데이터 조회
  const getDishWasteData = (dateString: string): DishWasteRate[] => {
    // menuData에서 해당 날짜의 wasteData 확인
    if (dateString in menuData && menuData[dateString].wasteData) {
      return menuData[dateString].wasteData!;
    }

    // 해당 날짜에 잔반률 데이터가 없는 경우
    return [{ name: '잔반률 데이터 없음', 잔반률: 0 }];
  };

  // 그래프의 날짜 선택 이벤트 핸들러
  const handleDotClick = (data: ChartClickData) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload[0].payload;
      setSelectedDate(clickedData.date);
      setSelectedDayWaste(getDishWasteData(clickedData.date));
    }
  };

  // 월간 잔반률 차트와 캘린더 뷰 전환
  const toggleView = () => {
    setShowWasteChart(!showWasteChart);
    setSelectedDayWaste(null);
    if (selectedDate && !showWasteChart) {
      // 캘린더에서 차트로 전환 시 선택된 날짜가 있으면 해당 날짜의 반찬별 잔반률 표시
      setSelectedDayWaste(getDishWasteData(selectedDate));
    }
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
          <div
            className="bg-[#F8F1E7] rounded-3xl shadow-lg p-0 flex flex-col overflow-hidden"
            style={{ height: '73vh' }}
          >
            {/* 캘린더 헤더 */}
            <CalendarHeader
              displayYearMonth={displayYearMonth}
              showWasteChart={showWasteChart}
              goToPrevMonth={goToPrevMonth}
              goToNextMonth={goToNextMonth}
              toggleView={toggleView}
              handleExcelDownload={handleExcelDownload}
            />

            {loading ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-lg">데이터를 불러오는 중입니다...</p>
              </div>
            ) : showWasteChart ? (
              // 월간 잔반률 차트 뷰
              <div className="px-6 py-3 flex-grow flex flex-row gap-4 mb-1">
                {/* 월간 잔반률 차트 */}
                <MonthlyWasteChart
                  monthlyWasteData={monthlyWasteData}
                  selectedDate={selectedDate}
                  handleDotClick={handleDotClick}
                />

                {/* 반찬별 잔반률 */}
                <DishWasteRates selectedDayWaste={selectedDayWaste} selectedDate={selectedDate} />
              </div>
            ) : (
              // 달력 뷰
              <div className="px-6 py-3 flex-grow flex flex-row gap-4 mb-1 overflow-hidden">
                {/* 달력 그리드 */}
                <CalendarGrid
                  days={days}
                  weeksCount={weeksCount}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  selectedDate={selectedDate}
                  handleDateClick={handleDateClick}
                  menuData={menuData}
                />

                {/* 선택된 날짜의 식단 */}
                <MenuDetail selectedDate={selectedDate} menuData={menuData} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
