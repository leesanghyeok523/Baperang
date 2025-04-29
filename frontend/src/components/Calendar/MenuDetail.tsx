import { MenuDataType } from '../../data/menuData';

interface MenuDetailProps {
  selectedDate: string | null;
  menuData: MenuDataType;
}

const MenuDetail = ({ selectedDate, menuData }: MenuDetailProps) => {
  return (
    <div className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col">
      {selectedDate && menuData[selectedDate] ? (
        <div className="flex flex-col h-full">
          <div className="text-lg font-semibold text-center mb-3">
            {menuData[selectedDate].date} 식단
          </div>
          <div className="flex-grow flex flex-col gap-3 items-center">
            {menuData[selectedDate].menu.map((item: string, index: number) => (
              <div
                key={index}
                className="bg-white w-full px-4 py-3 rounded-3xl text-base font-medium shadow-sm text-center"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          날짜를 선택하면 식단이 표시됩니다.
        </div>
      )}
    </div>
  );
};

export default MenuDetail;
