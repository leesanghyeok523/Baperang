import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import Card, { CardHeader, CardBody } from './ui/Card';
import { useNavigate } from 'react-router-dom';

interface MenuCardProps {
  menuItems: string[];
  currentDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ menuItems, currentDate, onPrevDay, onNextDay }) => {
  const navigate = useNavigate();

  // 날짜 포맷 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year} / ${month} / ${day}`;
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
        <div className="flex flex-col items-center justify-center h-full space-y-10">
          {menuItems.map((item, index) => (
            <div key={index} className="text-center w-full">
              <p className="text-2xl font-medium text-gray-800">{item}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default MenuCard;
