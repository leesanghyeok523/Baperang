import { isHoliday } from '../../data/holidays';
import { MenuDataType } from '../../data/menuData';

// 주말 여부 확인
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  // 0: 일요일, 6: 토요일
  return day === 0 || day === 6;
};

// 평일(근무일) 여부 확인
export const isWorkday = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const key = `${yyyy}-${mm}-${dd}`;
  return !isWeekend(date) && !isHoliday(key);
};

// 해당 월의 달력 날짜 생성
export interface CalendarDay {
  date: number;
  type: string;
  hasMenu?: boolean;
}

export const createCalendarDays = (
  selectedYear: number,
  selectedMonth: number,
  menuData: MenuDataType
): CalendarDay[] => {
  // 선택된 달의 첫 날짜
  const firstDay = new Date(selectedYear, selectedMonth, 1);
  // 선택된 달의 마지막 날짜
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  // 선택된 달의 첫 날이 무슨 요일인지 (0: 일요일, 1: 월요일, ..., 6: 토요일)
  const firstDayOfMonth = firstDay.getDay();
  // 선택된 달의 일수
  const daysInMonth = lastDay.getDate();

  // 이전 달의 마지막 날짜들 (빈 칸으로 표시)
  const prevMonthDays = Array(firstDayOfMonth)
    .fill(null)
    .map((_, i) => ({
      date: new Date(selectedYear, selectedMonth, 0).getDate() - firstDayOfMonth + i + 1,
      type: 'prev',
    }));

  // 현재 달의 날짜들
  const currentMonthDays = Array(daysInMonth)
    .fill(null)
    .map((_, i) => {
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(
        i + 1
      ).padStart(2, '0')}`;
      return {
        date: i + 1,
        type: 'current',
        hasMenu: dateString in menuData,
      };
    });

  return [...prevMonthDays, ...currentMonthDays];
};
