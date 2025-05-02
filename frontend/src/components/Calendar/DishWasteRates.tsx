import { WasteData } from '../../data/menuData';

interface DishWasteRatesProps {
  selectedDayWaste: WasteData[] | null;
  selectedDate: string | null;
}

const DishWasteRates = ({ selectedDayWaste, selectedDate }: DishWasteRatesProps) => {
  return (
    <div className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col">
      {selectedDayWaste ? (
        <div className="flex flex-col h-full">
          <div className="text-lg font-semibold text-center mb-3">
            {parseInt(selectedDate?.split('-')[2] || '0')}일 반찬별 잔반률
          </div>
          <div className="flex-grow flex flex-col gap-3 items-center">
            {(() => {
              // 최대 잔반률 계산
              const maxWasteRate = Math.max(...selectedDayWaste.map((dish) => dish.잔반률));

              return selectedDayWaste.map((dish, index) => (
                <div
                  key={index}
                  className="bg-white w-full px-4 py-3 rounded-3xl text-base font-medium shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span>{dish.name}</span>
                    <span
                      className={`font-bold ${
                        dish.잔반률 === maxWasteRate ? 'text-[#FF7814]' : 'text-green-600'
                      }`}
                    >
                      {dish.잔반률}%
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          그래프에서 날짜를 선택하면
          <br />
          반찬별 잔반률이 표시됩니다.
        </div>
      )}
    </div>
  );
};

export default DishWasteRates;
