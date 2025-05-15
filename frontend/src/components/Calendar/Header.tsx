import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiBarChart2,
  FiCalendar,
  FiEdit,
} from 'react-icons/fi';

interface CalendarHeaderProps {
  displayYearMonth: string;
  showWasteChart: boolean;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  toggleView: () => void;
  handleExcelDownload: () => void;
  isFutureMonth: boolean;
}

const CalendarHeader = ({
  displayYearMonth,
  showWasteChart,
  goToPrevMonth,
  goToNextMonth,
  toggleView,
  handleExcelDownload,
  isFutureMonth,
}: CalendarHeaderProps) => {
  return (
    <div className="grid grid-cols-3 items-center p-4 bg-white/50">
      {/* 왼쪽 - 뷰 전환 버튼 */}
      <div className="flex items-center">
        <button
          onClick={toggleView}
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
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={goToPrevMonth}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <FiChevronLeft size={30} />
        </button>
        <h1 className="text-xl font-bold text-center">
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
