import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
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
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <td className={STYLES.dataCell}>{item.date}</td>
        <td className={STYLES.dataCell}>{item.productName}</td>
        <td className={STYLES.dataCell}>{item.supplier}</td>
        <td className={STYLES.dataCell}>{item.price.toLocaleString()}원</td>
        <td className={STYLES.dataCell}>
          {item.orderedQuantity}
          {item.unit}
        </td>
        <td className={STYLES.dataCellFixed}>{renderEditableCell(item)}</td>
        <td className={`${STYLES.dataCellLastFixed} font-medium ${diff.color}`}>
          {diff.value}
          {item.unit}
        </td>
      </tr>
    );
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
              {/* 왼쪽 - 빈 영역 */}
              <div className="flex items-center">
                {/* 필요한 경우 여기에 추가 버튼이나 컨트롤 배치 */}
              </div>

              {/* 중앙 - 이전/다음 버튼과 제목 */}
              <div className="flex items-center justify-center relative w-[399px] left-4">
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
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    exportInventoryToExcel(filteredData, `재고관리_${currentMonth}월.xlsx`)
                  }
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800 mr-6"
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
                        <th className={STYLES.headerCell}>날짜</th>
                        <th className={STYLES.headerCell}>상품명</th>
                        <th className={STYLES.headerCell}>거래처</th>
                        <th className={STYLES.headerCell}>가격</th>
                        <th className={STYLES.headerCell}>주문수량</th>
                        <th className={STYLES.headerCell}>실제사용수량</th>
                        <th className={STYLES.headerCellLast}>diff</th>
                      </tr>
                    </thead>
                    <tbody>{currentData.map(renderTableRow)}</tbody>
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
    </div>
  );
};

export default InventoryPage;
