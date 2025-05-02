import { useState, useEffect } from 'react';
import MenuCard from '../../components/MainMenuCard';
import RateToggleCard from '../../components/RateToggle';
import { menuData, defaultMenu, defaultWasteData, WasteData } from '../../data/menuData';

const MainPage = () => {
  // 현재 날짜를 기준으로 초기화 (연도만 2025년으로 설정)
  const today = new Date();
  const initialDate = new Date(2025, today.getMonth(), today.getDate());
  const todayKey = `2025-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentMenuItems, setCurrentMenuItems] = useState<string[]>(defaultMenu);

  // 잔반률 데이터는 항상 오늘 날짜의 데이터 사용
  const [todayWasteData, setTodayWasteData] = useState<WasteData[]>(defaultWasteData);

  // 컴포넌트 마운트 시 오늘 날짜의 잔반률 데이터 설정 (한 번만 실행)
  useEffect(() => {
    if (todayKey in menuData && menuData[todayKey].wasteData) {
      setTodayWasteData(menuData[todayKey].wasteData || defaultWasteData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜 변경 시 메뉴 데이터만 업데이트
  useEffect(() => {
    updateMenuForDate(currentDate);
  }, [currentDate]);

  // 날짜에 맞는 메뉴 데이터만 찾기
  const updateMenuForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (dateKey in menuData) {
      // 메뉴 데이터만 업데이트
      setCurrentMenuItems(menuData[dateKey].menu);
    } else {
      setCurrentMenuItems(defaultMenu);
    }
  };

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
