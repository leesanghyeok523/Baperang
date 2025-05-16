import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiBarChart2,
  FiCalendar,
  FiEdit,
} from 'react-icons/fi';
import axios from 'axios';
import API_CONFIG from '../../config/api';

interface CalendarHeaderProps {
  displayYearMonth: string;
  showWasteChart: boolean;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  toggleView: () => void;
  handleExcelDownload: () => void;
  isFutureMonth: boolean;
  token?: string;
  onMenuGenerated?: () => void;
}

const CalendarHeader = ({
  displayYearMonth,
  showWasteChart,
  goToPrevMonth,
  goToNextMonth,
  toggleView,
  handleExcelDownload,
  isFutureMonth,
  token,
  onMenuGenerated,
}: CalendarHeaderProps) => {
  const makeMonthMenu = async () => {
    try {
      // 토큰이 유효한지 확인
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      // API 요청 URL 생성
      const endpoint = API_CONFIG.ENDPOINTS.MEAL.MAKE_MONTH_MENU;
      const url = API_CONFIG.getUrl(endpoint);

      console.log('다음 달 식단 생성 요청');

      // 토큰 형식 확인 및 처리
      const authHeaderValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const response = await axios.post(
        url,
        {}, // 요청 바디 비움 - 서버에서 자동으로 다음 달을 계산
        {
          headers: {
            Authorization: authHeaderValue,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('월간 식단 생성 성공:', response.data);

      // 식단 생성 후 콜백 호출
      if (onMenuGenerated) {
        onMenuGenerated();
      }
    } catch (error) {
      console.error('월간 식단 생성 실패:', error);
    }
  };

  const handleMenuButtonClick = () => {
    if (showWasteChart) {
      // 잔반율 화면에서 캘린더로 돌아갈 때
      toggleView();
    } else if (isFutureMonth) {
      // 미래 월에서 식단 생성하기 버튼 클릭 시
      makeMonthMenu();
      // 캘린더 뷰 유지 (토글하지 않음)
    } else {
      // 현재 월에서 잔반율 보기 버튼 클릭 시
      toggleView();
    }
  };

  return (
    <div className="grid grid-cols-3 items-center p-4 bg-white/50">
      {/* 왼쪽 - 뷰 전환 버튼 */}
      <div className="flex items-center">
        <button
          onClick={handleMenuButtonClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 ml-6"
        >
          {showWasteChart ? (
            <>
              <FiCalendar size={20} />
              <span>캘린더 보기</span>
            </>
          ) : (
            <>
              {isFutureMonth ? (
                <>
                  <FiEdit size={20} />
                  <span>식단생성하기</span>
                </>
              ) : (
                <>
                  <FiBarChart2 size={20} />
                  <span>월간 잔반률 보기</span>
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* 중앙 - 이전/다음 버튼과 제목 */}
      <div className="flex items-center justify-center">
        <button
          onClick={goToPrevMonth}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <FiChevronLeft size={30} />
        </button>
        <h1 className="text-xl font-bold text-center w-[50%]">
          {displayYearMonth} {showWasteChart ? '잔반률' : '식단표'}
        </h1>
        <button
          onClick={goToNextMonth}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <FiChevronRight size={30} />
        </button>
      </div>

      {/* 오른쪽 - Excel 버튼 */}
      <div className="flex justify-end">
        {!showWasteChart && (
          <button
            onClick={handleExcelDownload}
            className="flex items-center space-x-2 text-green-600 hover:text-green-800 mr-6"
          >
            <FiDownload size={20} />
            <span>Excel 저장</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarHeader;
