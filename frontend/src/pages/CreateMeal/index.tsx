import { useState, useEffect } from 'react';
import { MenuDataType } from '../../data/menuData';
import { createCalendarDays, isWorkday, CalendarDay } from '../Calendar/calendarUtils';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import MenuEditor from '../../components/CreateMeal/MenuEditor';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  menus: MenuItem[];
}

interface ApiResponse {
  days: DayData[];
}

const CreateMeal = () => {
  // 현재 날짜 기준으로 초기화
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableMenuData, setEditableMenuData] = useState<MenuDataType>({});
  const [loading, setLoading] = useState(false);

  // 화면에 표시할 년월 문자열
  const displayYearMonth = `${selectedYear}년 ${selectedMonth + 1}월`;

  // API에서 월별 메뉴 데이터 가져오기
  const fetchMonthlyMenu = async () => {
    try {
      setLoading(true);
      const { accessToken } = useAuthStore.getState();

      if (!accessToken) {
        console.error('인증 토큰이 없습니다. 로그인이 필요합니다.');
        return;
      }

      const endpoint = API_CONFIG.ENDPOINTS.MEAL.MENU_CALENDAR;
      const url = API_CONFIG.getUrl(endpoint, {
        year: selectedYear.toString(),
        month: (selectedMonth + 1).toString(),
      });

      console.log('메뉴 데이터 요청 URL:', url);

      // 토큰 형식 확인 및 처리
      const authHeaderValue = accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`;

      const response = await axios.get<ApiResponse>(url, {
        headers: {
          Authorization: authHeaderValue,
          'Content-Type': 'application/json',
        },
      });

      console.log('API 응답:', response.data);

      // 응답 데이터를 MenuDataType 형식으로 변환
      const transformedData: MenuDataType = {};

      if (response.data && response.data.days) {
        response.data.days.forEach((day) => {
          // 메뉴 이름 추출 및 처리
          const menuNames: string[] = [];

          // 메뉴가 배열 형태인 경우 (일반적인 경우)
          if (Array.isArray(day.menus)) {
            day.menus.forEach((menu) => {
              // menuName이 HTML 태그를 포함한 문자열인 경우
              if (menu.menuName && typeof menu.menuName === 'string') {
                menuNames.push(menu.menuName);
              }
            });
          }

          // 메뉴 배열이 비어있는 경우 기본값 사용
          if (menuNames.length === 0) {
            <div className="flex flex-col items-center justify-center text-gray-400 mt-4">
              메뉴 정보가 없습니다.
            </div>;
          }

          transformedData[day.date] = {
            date: `${parseInt(day.date.split('-')[1])}월 ${parseInt(day.date.split('-')[2])}일`,
            menu: menuNames,
          };
        });
      }

      console.log('변환된 메뉴 데이터:', transformedData);

      setEditableMenuData(transformedData);
    } catch (error) {
      console.error('메뉴 데이터 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 년/월 변경 시 데이터 가져오기
  useEffect(() => {
    fetchMonthlyMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  // 월 이동 함수
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setSelectedDate(null);
  };

  // 달력의 주 수 계산
  const calculateWeeks = (days: CalendarDay[]) => {
    const totalDays = days.length;
    return Math.ceil(totalDays / 7);
  };

  // 해당 월의 달력 날짜 생성
  const days = createCalendarDays(selectedYear, selectedMonth, editableMenuData);
  const weeksCount = calculateWeeks(days);

  const handleDateClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;

    // 평일인 경우에만 선택 가능하도록 함
    if (isWorkday(dateStr)) {
      setSelectedDate(dateStr);
    } else {
      setSelectedDate(null);
    }
  };

  // 메뉴 수정 시작
  const handleEditStart = () => {
    setEditMode(true);
  };

  // 메뉴 저장
  const handleSaveMenu = (date: string, menuItems: string[]) => {
    // API로 데이터 저장 코드를 추가해야 함 (현재는 로컬 상태만 업데이트)
    setEditableMenuData((prevData) => ({
      ...prevData,
      [date]: {
        ...prevData[date],
        menu: menuItems,
      },
    }));
    setEditMode(false);
  };

  // 메뉴 수정 취소
  const handleCancelEdit = () => {
    setEditMode(false);
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
        <div className="w-[90%] mx-auto">
          <div
            className="bg-[#F8F1E7] rounded-3xl shadow-lg p-0 flex flex-col overflow-hidden"
            style={{ height: '73vh' }}
          >
            {/* 캘린더 헤더 */}
            <div className="flex justify-center items-center p-4 bg-white/50">
              <div className="flex justify-center items-center relative w-[400px]">
                <button
                  onClick={goToPrevMonth}
                  className="text-gray-600 hover:text-gray-900 absolute left-0"
                >
                  <FiChevronLeft size={30} />
                </button>
                <span className="text-xl font-bold text-center w-full">
                  {displayYearMonth} 식단 생성
                </span>
                <button
                  onClick={goToNextMonth}
                  className="text-gray-600 hover:text-gray-900 absolute right-0"
                >
                  <FiChevronRight size={30} />
                </button>
              </div>
            </div>

            {/* 달력 및 메뉴 편집 영역 */}
            {loading ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-lg">데이터를 불러오는 중입니다...</p>
              </div>
            ) : (
              <div className="px-6 py-3 flex-grow flex flex-row gap-4 mb-1">
                {/* 달력 그리드 */}
                <CalendarGrid
                  days={days}
                  weeksCount={weeksCount}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  selectedDate={selectedDate}
                  handleDateClick={handleDateClick}
                  menuData={editableMenuData}
                />

                {/* 메뉴 편집기 */}
                <MenuEditor
                  selectedDate={selectedDate}
                  menuData={editableMenuData}
                  editMode={editMode}
                  onEditStart={handleEditStart}
                  onSave={handleSaveMenu}
                  onCancel={handleCancelEdit}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeal;
