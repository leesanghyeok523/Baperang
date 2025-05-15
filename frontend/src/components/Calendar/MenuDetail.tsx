import { MenuDataType } from '../../pages/Calendar/index';

interface MenuDetailProps {
  selectedDate: string | null;
  menuData: MenuDataType;
}

const MenuDetail = ({ selectedDate, menuData }: MenuDetailProps) => {
  // 선택된 날짜가 없는 경우
  if (!selectedDate) {
    return (
      <div
        className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
        style={{ width: '350px', flexShrink: 0 }}
      >
        <div className="h-full flex items-center justify-center text-gray-500">
          날짜를 선택하면 식단이 표시됩니다.
        </div>
      </div>
    );
  }

  // 선택된 날짜의 요일 계산
  const date = new Date(selectedDate);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = weekdays[date.getDay()];

  // 날짜 포맷팅 (YYYY-MM-DD → MM월 DD일)
  const formattedDate = selectedDate
    ? `${parseInt(selectedDate.split('-')[1])}월 ${parseInt(selectedDate.split('-')[2])}일`
    : '';

  // 선택된 날짜에 메뉴 데이터가 없는 경우
  const hasNoMenu = !menuData[selectedDate] || menuData[selectedDate].menu.length === 0;

  return (
    <div
      className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
      style={{ width: '350px', flexShrink: 0 }}
    >
      <div className="flex flex-col h-full">
        <div className="text-base font-semibold text-center mb-3">
          {formattedDate} ({dayOfWeek}) 식단
        </div>
        <div className="flex-grow flex flex-col h-[380px]">
          {!hasNoMenu ? (
            // 메뉴가 있는 경우 메뉴 목록 표시
            <div className="flex-grow flex flex-col gap-3 items-center overflow-y-auto">
              {menuData[selectedDate].menu.map((item: string, index: number) => (
                <div
                  key={index}
                  className="bg-white w-[95%] px-4 py-3 rounded-3xl text-base shadow-sm text-center mb-2"
                >
                  <div className="truncate">{item}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-gray-400 mb-6">메뉴 정보가 없습니다.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuDetail;
