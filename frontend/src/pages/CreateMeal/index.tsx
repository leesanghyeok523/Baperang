import { useState } from 'react';
import { menuData } from '../../data/menuData';
import { createCalendarDays, isWorkday, CalendarDay } from '../Calendar/calendarUtils';
import CalendarGrid from '../../components/Calendar/CalendarGrid';
import MenuEditor from '../../components/CreateMeal/MenuEditor';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CreateMeal = () => {
  // 현재 날짜 기준으로 초기화 (연도만 2025년으로 설정)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableMenuData, setEditableMenuData] = useState({ ...menuData });

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
        <div className="w-[85%] mx-auto">
          <div
            className="bg-[#F8F1E7] rounded-3xl shadow-lg p-0 flex flex-col overflow-hidden"
            style={{ height: '73vh' }}
          >
            {/* 캘린더 헤더 */}
            <div className="flex justify-center items-center p-4 bg-white/50">
              <div className="flex justify-center items-center space-x-4">
                <button onClick={goToPrevMonth} className="text-gray-600 hover:text-gray-900">
                  <FiChevronLeft size={30} />
                </button>
                <span className="text-xl font-bold">{displayYearMonth} 식단 생성</span>
                <button onClick={goToNextMonth} className="text-gray-600 hover:text-gray-900">
                  <FiChevronRight size={30} />
                </button>
              </div>
            </div>

            {/* 달력 및 메뉴 편집 영역 */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeal;
