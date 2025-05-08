import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import Card, { CardHeader, CardBody } from './ui/Card';
import { useNavigate } from 'react-router-dom';

export interface MenuCardProps {
  menuItems: string[];
  currentDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  loading?: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({
  menuItems,
  currentDate,
  onPrevDay,
  onNextDay,
  loading = false,
}) => {
  const navigate = useNavigate();

  // 날짜 포맷 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[date.getDay()];

    return `${year} / ${month} / ${day} (${weekDay})`;
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  return (
    <Card>
      <CardHeader>
        <button
          onClick={onPrevDay}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <FiChevronLeft size={30} />
        </button>
        <div className="flex items-center space-x-4 font-semibold text-gray-800 text-xl">
          <span>{formatDate(currentDate)}</span>
          <button onClick={handleCalendarClick} className="focus:outline-none">
            <FiCalendar />
          </button>
        </div>
        <button
          onClick={onNextDay}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <FiChevronRight size={30} />
        </button>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col items-center justify-center h-full py-2">
          {loading ? (
            <div className="text-center">
              <p className="text-xl font-medium text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : menuItems.length > 0 ? (
            <div className="w-full space-y-3 overflow-y-auto max-h-[calc(100vh-220px)]">
              {menuItems.map((item, index) => (
                <div key={index} className="text-center p-1 rounded-lg bg-transparent">
                  <p className="text-lg font-medium text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl font-medium text-gray-200">오늘의 메뉴가 없습니다</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default MenuCard;
