import React, { useState, useEffect, useMemo } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiPlus,
  FiEdit,
  FiCheck,
  FiMinus,
} from 'react-icons/fi';
import { inventoryData, InventoryItem } from '../../data/inventoryData';
import { exportInventoryToExcel } from './excelExporter';

// 공통 스타일 상수 정의
const STYLES = {
  headerCell:
    'py-[1%] px-1 text-center border-t border-b border-r border-gray-300 font-semibold truncate text-base md:text-lg',
  headerCellLast:
    'py-[1%] px-1 text-center border-t border-b border-gray-300 font-semibold truncate text-base md:text-lg',
  dataCell:
    'py-[1%] px-1 text-center border-b border-r border-gray-300 truncate text-base md:text-lg',
  dataCellLast: 'py-[1%] px-1 text-center border-b border-gray-300 truncate text-base md:text-lg',
  dataCellFixed:
    'py-[1%] px-1 text-center border-b border-r border-gray-300 truncate text-base md:text-lg',
  dataCellLastFixed:
    'py-[1%] px-1 text-center border-b border-gray-300 truncate text-base md:text-lg',
};

const InventoryPage: React.FC = () => {
  // 상태 관리
  const [inventory, setInventory] = useState<InventoryItem[]>(inventoryData);
  const [currentMonth, setCurrentMonth] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 8;

  // 수정 중인 아이템의 ID와 수정 값
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // 항목 추가/삭제 상태
  const [isAddingNewRow, setIsAddingNewRow] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    date: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').replace('.', ''),
    productName: '',
    supplier: '',
    price: 0,
    orderedQuantity: 0,
    usedQuantity: 0,
    unit: '개',
  });

  // 필터링된 데이터 (현재 월에 해당하는 데이터만)
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);

  // 월별 데이터 필터링
  useEffect(() => {
    const filtered = inventory.filter((item) => {
      const itemMonth = parseInt(item.date.split('.')[1]);
      return itemMonth === currentMonth;
    });

    setFilteredData(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // 월 변경 시 첫 페이지로 이동
  }, [inventory, currentMonth]);

  // 현재 페이지에 표시할 데이터
  const currentData = useMemo(() => {
    // 추가 행이 있으면 한 개 적게 표시
    const effectiveItemsPerPage = isAddingNewRow ? itemsPerPage - 1 : itemsPerPage;

    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      (currentPage - 1) * itemsPerPage + effectiveItemsPerPage
    );
  }, [filteredData, currentPage, itemsPerPage, isAddingNewRow]);

  // 월 변경 함수
  const prevMonth = () => {
    setCurrentMonth((prev) => (prev === 1 ? 12 : prev - 1));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => (prev === 12 ? 1 : prev + 1));
  };

  // 페이지 변경 함수
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // 사용 수량 수정 시작
  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValue(item.usedQuantity.toString());
  };

  // 사용 수량 수정 저장
  const saveEdit = () => {
    if (editingId === null) return;

    const updatedInventory = inventory.map((item) => {
      if (item.id === editingId) {
        const newValue = parseInt(editValue) || 0;
        return {
          ...item,
          usedQuantity: newValue,
        };
      }
      return item;
    });

    setInventory(updatedInventory);
    setEditingId(null);
  };

  // 항목 삭제 처리
  const handleDeleteItem = () => {
    if (deleteConfirmId === null) return;

    setInventory((prev) => prev.filter((item) => item.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  // diff 계산 및 색상 결정
  const calculateDiff = (ordered: number, used: number) => {
    const diff = ordered - used;
    let color = 'text-black';
    if (diff > 0) color = 'text-red-600';
    else if (diff < 0) color = 'text-blue-600';
    return { value: diff, color };
  };

  // 데이터 셀 렌더링 함수
  const renderEditableCell = (item: InventoryItem) => {
    return (
      <div className="flex items-center justify-center h-full w-full">
        {editingId === item.id ? (
          <div className="flex items-center justify-center w-full min-h-[20px] h-full">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              className="w-16 h-8 p-1 border rounded text-center text-base"
              autoFocus
            />
            <span className="ml-1 text-base">{item.unit}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full min-h-[20px] h-full">
            <span
              onClick={() => startEdit(item)}
              className="cursor-pointer hover:bg-gray-100 p-1 rounded text-base w-16 h-8 flex items-center justify-center"
            >
              {item.usedQuantity}
              {item.unit}
            </span>
          </div>
        )}
      </div>
    );
  };

  // 테이블 행 렌더링 함수
  const renderTableRow = (item: InventoryItem) => {
    const diff = calculateDiff(item.orderedQuantity, item.usedQuantity);
    return (
      <tr key={item.id} className="hover:bg-[#E7E3DE]">
        {isEditMode && (
          <td className="w-15 text-center border-b border-r border-gray-300">
            <button
              onClick={() => setDeleteConfirmId(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <FiMinus size={18} />
            </button>
          </td>
        )}
        <td className={STYLES.dataCell}>{item.date}</td>
        <td className={STYLES.dataCell}>{item.productName}</td>
        <td className={STYLES.dataCell}>{item.supplier}</td>
        <td className={STYLES.dataCell}>{item.price.toLocaleString()}원</td>
        <td className={STYLES.dataCell}>
          {item.orderedQuantity}
          {item.unit}
        </td>
        <td className={STYLES.dataCellFixed}>{renderEditableCell(item)}</td>
        <td className={`${STYLES.dataCellLast} font-medium ${diff.color}`}>
          {diff.value}
          {item.unit}
        </td>
      </tr>
    );
  };

  // 편집 모드 토글 함수
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // 편집 모드 종료 시 삭제 확인 모달 닫기
      setDeleteConfirmId(null);
    }
  };

  // 새 행 추가 관련 함수

  // 새 행 추가 시작
  const startAddingNewRow = () => {
    setNewItem({
      date: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').replace('.', ''),
      productName: '',
      supplier: '',
      price: 0,
      orderedQuantity: 0,
      usedQuantity: 0,
      unit: '개',
    });
    setIsAddingNewRow(true);
  };

  // 새 행 추가 취소
  const cancelAddingNewRow = () => {
    setIsAddingNewRow(false);
  };

  // 새 행 추가 저장
  const saveNewRow = () => {
    // 유효성 검사
    if (
      !newItem.productName ||
      !newItem.supplier ||
      newItem.price === undefined ||
      newItem.orderedQuantity === undefined
    ) {
      alert('모든 필드를 입력해주세요');
      return;
    }

    // 새 ID 생성 (가장 큰 ID + 1)
    const maxId = inventory.length > 0 ? Math.max(...inventory.map((item) => item.id)) : 0;
    const newItemWithId: InventoryItem = {
      ...(newItem as InventoryItem),
      id: maxId + 1,
    };

    // 인벤토리에 추가
    setInventory((prev) => [...prev, newItemWithId]);

    // 새 행 추가 모드 종료
    setIsAddingNewRow(false);
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0 bg-main bg-cover bg-center"></div>

      {/* 메인 컨텐츠 */}
      <div
        className="relative z-10 flex items-center justify-center"
        style={{ height: 'calc(100vh - 80px)', marginTop: '75px' }}
      >
        <div className="w-[90%] h-[73vh] mx-auto flex flex-col">
          <div className="bg-[#F8F1E7] rounded-3xl shadow-lg p-0 flex flex-col flex-grow overflow-hidden">
            {/* 헤더 */}
            <div className="grid grid-cols-3 items-center p-4">
              {/* 왼쪽 - 항목 추가 버튼과 편집 버튼 */}
              <div className="flex items-center space-x-8 ml-4">
                <button
                  onClick={startAddingNewRow}
                  className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
                >
                  <FiPlus size={20} />
                  <span>항목 추가</span>
                </button>
                <button
                  onClick={toggleEditMode}
                  className={`flex items-center space-x-2 ${
                    isEditMode
                      ? 'text-red-600 hover:text-red-800'
                      : 'text-red-600 hover:text-red-800'
                  }`}
                >
                  {isEditMode ? (
                    <>
                      <FiCheck size={20} />
                      <span>삭제 완료</span>
                    </>
                  ) : (
                    <>
                      <FiEdit size={18} />
                      <span>항목 삭제</span>
                    </>
                  )}
                </button>
              </div>

              {/* 중앙 - 이전/다음 버튼과 제목 */}
              <div className="flex items-center justify-center relative">
                <button
                  onClick={prevMonth}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none absolute left-0"
                >
                  <FiChevronLeft size={30} />
                </button>
                <h1 className="text-xl font-bold text-center w-full">{currentMonth}월 재고관리</h1>
                <button
                  onClick={nextMonth}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none absolute right-0"
                >
                  <FiChevronRight size={30} />
                </button>
              </div>

              {/* 오른쪽 - Excel 버튼 */}
              <div className="flex justify-end mr-6">
                <button
                  onClick={() =>
                    exportInventoryToExcel(filteredData, `재고관리_${currentMonth}월.xlsx`)
                  }
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800"
                >
                  <FiDownload size={20} />
                  <span>엑셀로 다운받기</span>
                </button>
              </div>
            </div>

            {/* 테이블 */}
            <div className="flex-grow flex flex-col overflow-hidden w-full h-full">
              <div className="flex-grow overflow-auto flex flex-col h-full relative">
                <div className="absolute inset-0 overflow-auto">
                  <table className="w-full bg-[#FCF8F3] border-t border-b border-gray-300 border-collapse table-fixed mb-0">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#FCF8F3]">
                        {isEditMode && (
                          <th className="w-10 pl-2 py-[1%] text-center border-t border-b border-r border-gray-300 font-semibold">
                            <FiMinus size={18} className="opacity-0" />
                          </th>
                        )}
                        <th className={STYLES.headerCell}>날짜</th>
                        <th className={STYLES.headerCell}>상품명</th>
                        <th className={STYLES.headerCell}>거래처</th>
                        <th className={STYLES.headerCell}>가격</th>
                        <th className={STYLES.headerCell}>주문수량</th>
                        <th className={STYLES.headerCell}>실제사용수량</th>
                        <th className={STYLES.headerCellLast}>diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 새 행 추가 행 */}
                      {isAddingNewRow && (
                        <tr className="hover:bg-[#E7E3DE] bg-white/10">
                          {isEditMode && (
                            <td className="w-10 pl-2 text-center border-b border-r border-l border-gray-300 p-[1%]">
                              <button className="text-red-500 opacity-0">
                                <FiMinus size={18} />
                              </button>
                            </td>
                          )}
                          <td className="text-center border-b border-r border-gray-300 p-[0.7%]">
                            <input
                              type="date"
                              value={
                                newItem.date
                                  ? (() => {
                                      try {
                                        const parts = newItem.date.split('.');
                                        if (parts.length === 3) {
                                          return `${parts[0]}-${parts[1].padStart(
                                            2,
                                            '0'
                                          )}-${parts[2].padStart(2, '0')}`;
                                        }
                                        return '';
                                      } catch {
                                        return '';
                                      }
                                    })()
                                  : ''
                              }
                              onChange={(e) => {
                                const dateValue = e.target.value;
                                if (dateValue) {
                                  const [year, month, day] = dateValue.split('-');
                                  setNewItem({
                                    ...newItem,
                                    date: `${year}.${month}.${day}`,
                                  });
                                }
                              }}
                              className="w-[83%] bg-white/70 p-2 border rounded-xl h-[40px]"
                            />
                          </td>
                          <td className="text-center border-b border-r border-gray-300 p-[0.7%]">
                            <input
                              type="text"
                              value={newItem.productName || ''}
                              onChange={(e) =>
                                setNewItem({ ...newItem, productName: e.target.value })
                              }
                              placeholder="상품명"
                              className="w-[80%] bg-white/70 p-2 border rounded-xl h-[40px]"
                            />
                          </td>
                          <td className="text-center border-b border-r border-gray-300 p-[0.7%] ">
                            <input
                              type="text"
                              value={newItem.supplier || ''}
                              onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                              placeholder="거래처"
                              className="w-[80%] bg-white/70 p-2 border rounded-xl h-[40px]"
                            />
                          </td>
                          <td className="text-center border-b border-r border-gray-300 p-[0.7%]">
                            <div className="relative">
                              <input
                                type="text"
                                value={newItem.price || 0}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setNewItem({ ...newItem, price: value ? parseInt(value) : 0 });
                                }}
                                className="w-[80%] bg-white/70 p-2 border rounded-xl h-[40px] pr-8"
                              />
                              <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-500">
                                원
                              </span>
                            </div>
                          </td>
                          <td className="text-center border-b border-r border-gray-300 p-[0.7%]">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                value={newItem.orderedQuantity || 0}
                                onChange={(e) =>
                                  setNewItem({
                                    ...newItem,
                                    orderedQuantity: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-[50%] bg-white/70 p-2 border rounded-xl h-[40px]"
                              />
                              <select
                                value={newItem.unit || '개'}
                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                className="w-[30%] bg-white/70 p-2 border rounded-xl h-[40px] ml-1"
                              >
                                <option value="개">개</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="ml">ml</option>
                                <option value="박스">박스</option>
                              </select>
                            </div>
                          </td>
                          <td className="text-center border-b border-r border-gray-300 p-[0.7%]">
                            <input
                              type="number"
                              value={newItem.usedQuantity || 0}
                              onChange={(e) =>
                                setNewItem({
                                  ...newItem,
                                  usedQuantity: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-[80%] bg-white/70 p-2 border rounded-xl h-[40px]"
                            />
                          </td>
                          <td className="text-center border-b border-gray-300 font-medium p-[0.7%]">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={saveNewRow}
                                className="bg-green-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-green-600"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelAddingNewRow}
                                className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-600"
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {currentData.map(renderTableRow)}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이지네이션 */}
              <div className="flex justify-center items-center h-[7vh] min-h-[60px] mt-0">
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 md:space-x-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`mx-1 md:mx-2 px-3 md:px-4 py-1 md:py-2 font-semibold ${
                          currentPage === page ? 'text-orange-500' : 'text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] max-w-[90%]">
            <h2 className="text-xl font-bold mb-4">항목 삭제</h2>
            <p className="mb-6">정말로 이 항목을 삭제하시겠습니까?</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
