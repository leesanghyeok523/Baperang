import React, { useState, useEffect } from 'react';

interface MenuData {
  [date: string]: {
    menu: string[];
    wasteData?: { name: string; 잔반률: number }[];
  };
}

interface MenuEditorProps {
  selectedDate: string | null;
  menuData: MenuData;
  editMode: boolean;
  onEditStart: () => void;
  onSave: (date: string, menuItems: string[]) => void;
  onCancel: () => void;
}

const MenuEditor: React.FC<MenuEditorProps> = ({
  selectedDate,
  menuData,
  editMode,
  onEditStart,
  onSave,
  onCancel,
}) => {
  const [editableMenu, setEditableMenu] = useState<string[]>([]);

  useEffect(() => {
    // 선택된 날짜가 바뀌면 해당 메뉴로 초기화
    if (selectedDate && menuData[selectedDate]) {
      setEditableMenu([...menuData[selectedDate].menu]);
    } else {
      setEditableMenu([]);
    }
  }, [selectedDate, menuData]);

  // 메뉴 항목 변경 핸들러
  const handleMenuItemChange = (index: number, value: string) => {
    const newMenu = [...editableMenu];
    newMenu[index] = value;
    setEditableMenu(newMenu);
  };

  // 메뉴 항목 추가
  const handleAddMenuItem = () => {
    setEditableMenu([...editableMenu, '']);
  };

  // 메뉴 항목 삭제
  const handleRemoveMenuItem = (index: number) => {
    const newMenu = [...editableMenu];
    newMenu.splice(index, 1);
    setEditableMenu(newMenu);
  };

  // 저장 버튼 클릭 핸들러
  const handleSave = () => {
    if (selectedDate) {
      onSave(
        selectedDate,
        editableMenu.filter((item) => item.trim() !== '')
      );
    }
  };

  // 날짜가 선택되지 않은 경우
  if (!selectedDate) {
    return (
      <div
        className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col"
        style={{ width: '350px', flexShrink: 0 }}
      >
        <div className="h-full flex items-center justify-center text-gray-500">
          날짜를 선택하면 식단이 표시됩니다.
        </div>
      </div>
    );
  }

  // 선택된 날짜에 메뉴 데이터가 없는 경우
  if (!menuData[selectedDate]) {
    return (
      <div
        className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
        style={{ width: '350px', flexShrink: 0 }}
      >
        {editMode ? (
          <div className="flex flex-col h-full">
            <div className="text-base font-semibold text-center mb-3">
              {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 수정
            </div>
            <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[336px] pr-1">
              {editableMenu.map((item, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleMenuItemChange(index, e.target.value)}
                    className="w-full rounded-3xl px-4 py-3 bg-white text-center text-xs focus:outline-none focus:bg-[#E7E3DE] pr-8 pl-8 shadow-sm"
                  />
                  <button
                    onClick={() => handleRemoveMenuItem(index)}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex justify-center mt-2">
                <button
                  onClick={handleAddMenuItem}
                  className="flex items-center justify-center text-orange-600 hover:text-orange-800"
                >
                  <span>+ 메뉴 추가</span>
                </button>
              </div>
            </div>
            <div className="flex justify-center space-x-16 mt-4">
              <button
                onClick={onCancel}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <span>취소</span>
              </button>
              <button
                onClick={handleSave}
                className="flex items-center text-orange-600 hover:text-orange-800"
              >
                <span>저장</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="text-base font-semibold text-center mb-3">
              {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 식단
            </div>
            <div className="flex-grow flex items-center justify-center text-gray-500 mb-4">
              이 날짜에는 식단이 없습니다.
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={onEditStart}
                className="flex items-center text-orange-600 hover:text-orange-800"
              >
                <span>식단 추가하기</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 선택된 날짜에 메뉴가 있고, 보기 모드인 경우
  if (!editMode) {
    return (
      <div
        className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
        style={{ width: '350px', flexShrink: 0 }}
      >
        <div className="flex flex-col h-full">
          <div className="text-base font-semibold text-center mb-3">
            {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 식단
          </div>
          <div className="flex-grow flex flex-col gap-3 items-center overflow-y-auto max-h-[336px] pr-1">
            {menuData[selectedDate].menu.map((item, index) => (
              <div
                key={index}
                className="bg-white w-full px-4 py-3 rounded-3xl text-base text-xs shadow-sm text-center"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={onEditStart}
              className="flex items-center text-orange-600 hover:text-orange-800"
            >
              <span>식단 수정하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 편집 모드인 경우
  return (
    <div
      className="w-1/5 bg-[#FCF8F3]/90 rounded-3xl p-4 flex flex-col h-full"
      style={{ width: '350px', flexShrink: 0 }}
    >
      <div className="flex flex-col h-full">
        <div className="text-base font-semibold text-center mb-3">
          {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 수정
        </div>
        <div className="flex-grow flex flex-col gap-3 overflow-y-auto max-h-[336px] pr-1">
          {editableMenu.map((item, index) => (
            <div key={index} className="relative">
              <input
                type="text"
                value={item}
                onChange={(e) => handleMenuItemChange(index, e.target.value)}
                className="w-full rounded-3xl px-4 py-3 bg-white text-center text-xs focus:outline-none focus:bg-[#E7E3DE] pr-8 pl-8 shadow-sm"
              />
              <button
                onClick={() => handleRemoveMenuItem(index)}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex justify-center mt-2">
            <button
              onClick={handleAddMenuItem}
              className="flex items-center justify-center text-orange-600 hover:text-orange-800"
            >
              <span>+ 메뉴 추가</span>
            </button>
          </div>
        </div>
        <div className="flex justify-center space-x-16 mt-4">
          <button
            onClick={onCancel}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <span>취소</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center text-orange-600 hover:text-orange-800"
          >
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuEditor;
