import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { MenuDataType } from './index';
import { showErrorAlert, showSuccessAlert } from '../../utils/sweetalert';

/**
 * 월별 식단표를 Excel 파일로 다운로드하는 함수
 * @param year 연도
 * @param month 월 (0-11)
 * @param menuData 메뉴 데이터
 */
export const downloadMenuExcel = (year: number, month: number, menuData: MenuDataType): void => {
  try {
    // 해당 월의 일수 계산
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 먼저 최대 메뉴 수를 계산
    let maxMenuCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`;
      if (dateStr in menuData && menuData[dateStr].menu.length > maxMenuCount) {
        maxMenuCount = menuData[dateStr].menu.length;
      }
    }

    const excelData: string[][] = [];

    // 헤더 행 생성 (날짜, 요일, 메뉴1, 메뉴2, ...)
    const header = ['날짜', '요일'];
    for (let i = 0; i < maxMenuCount; i++) {
      header.push(`메뉴 ${i + 1}`);
    }
    excelData.push(header);

    // 요일 이름 배열
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 모든 날짜에 대해 식단 데이터 수집
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      // 요일 구하기
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];

      // 기본 행 데이터 (날짜, 요일)
      const rowData: string[] = [`${mm}월 ${dd}일`, dayName];

      // 해당 날짜에 메뉴 데이터가 있으면 추가
      if (dateStr in menuData) {
        const menuItems = menuData[dateStr].menu;
        // 각 메뉴 항목을 추가 (부족한 부분은 빈 문자열로 채움)
        for (let i = 0; i < maxMenuCount; i++) {
          rowData.push(i < menuItems.length ? menuItems[i] : '');
        }
      } else {
        // 메뉴 없음 (빈 셀 추가)
        for (let i = 0; i < maxMenuCount; i++) {
          rowData.push('');
        }
      }

      // 행 데이터 추가
      excelData.push(rowData);
    }

    // Excel 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 열 너비 설정
    const colWidths = [
      { wch: 10 }, // 날짜
      { wch: 5 }, // 요일
    ];

    // 각 메뉴 열의 너비 설정
    for (let i = 0; i < maxMenuCount; i++) {
      colWidths.push({ wch: 20 }); // 메뉴 항목 열 너비
    }

    ws['!cols'] = colWidths;

    // 워크북 생성 및 워크시트 추가
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${year}년 ${month + 1}월 식단표`);

    // 파일 이름 설정
    const fileName = `${year}년 ${month + 1}월 식단표.xlsx`;

    // 파일 다운로드 (브라우저 환경에 맞게 조정)
    // Step 1: XLSX를 바이너리 문자열로 변환
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Step 2: Blob 생성
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // Step 3: FileSaver를 사용하여 다운로드
    saveAs(blob, fileName);

    showSuccessAlert('엑셀 파일 다운로드 완료');
  } catch (_) {
    showErrorAlert('엑셀 파일 다운로드 오류', '엑셀 파일 다운로드 중 오류가 발생했습니다.');
  }
};
