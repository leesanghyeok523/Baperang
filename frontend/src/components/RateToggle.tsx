import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { WasteData } from '../data/menuData';
import Card, { CardHeader, CardBody } from './ui/Card';
import WasteRateCard from './WasteRateCard';
import PreferenceChart from './PreferenceChart';
import MealCompletionRate from './MealCompletionRate';

interface RateToggleCardProps {
  data: WasteData[];
}

const RateToggleCard: React.FC<RateToggleCardProps> = ({ data }) => {
  // 0: 실시간 잔반률, 1: 실시간 선호도, 2: 실시간 식사 완료율
  const [viewMode, setViewMode] = useState(0);

  // 임시 식사 완료율 데이터 (실제로는 API나 props로 받아야 함)
  const completionRate = 80;

  const handleLeftClick = () => {
    // 왼쪽으로 전환 (현재 모드에서 -1, 0보다 작아지면 마지막 모드로)
    setViewMode((prev) => (prev > 0 ? prev - 1 : 2));
  };

  const handleRightClick = () => {
    // 오른쪽으로 전환 (현재 모드에서 +1, 마지막 모드보다 커지면 첫 모드로)
    setViewMode((prev) => (prev < 2 ? prev + 1 : 0));
  };

  // 현재 모드에 따른 제목 설정
  const getTitle = () => {
    switch (viewMode) {
      case 0:
        return '실시간 잔반률';
      case 1:
        return '실시간 선호도';
      case 2:
        return '실시간 식사 완료율';
      default:
        return '실시간 잔반률';
    }
  };

  // 현재 모드에 따른 컴포넌트 렌더링
  const renderContent = () => {
    switch (viewMode) {
      case 0:
        return <WasteRateCard data={data} />;
      case 1:
        return <PreferenceChart data={data} />;
      case 2:
        return <MealCompletionRate completionRate={completionRate} />;
      default:
        return <WasteRateCard data={data} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <button
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={handleLeftClick}
        >
          <FiChevronLeft size={30} />
        </button>
        <div className="font-semibold text-gray-800 text-2xl">{getTitle()}</div>
        <button
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={handleRightClick}
        >
          <FiChevronRight size={30} />
        </button>
      </CardHeader>
      <CardBody className="flex items-center justify-center">
        <div className="w-full h-full" style={{ maxHeight: 'calc(70vh - 100px)' }}>
          {renderContent()}
        </div>
      </CardBody>
    </Card>
  );
};

export default RateToggleCard;
