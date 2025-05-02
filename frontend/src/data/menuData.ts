import { isHoliday } from './holidays';

// 날짜별 식단 데이터 타입 정의
export interface MenuItem {
  date: string;
  menu: string[];
  wasteData?: WasteData[]; // 해당 날짜의 잔반률 데이터
}

export interface MenuDataType {
  [key: string]: MenuItem;
}

// 잔반률 데이터 타입 정의
export interface WasteData {
  name: string;
  잔반률: number;
}

// 실제 음식 이름 리스트
const foodNames = [
  '김치찌개',
  '제육볶음',
  '계란말이',
  '오이무침',
  '된장국',
  '불고기',
  '감자조림',
  '시금치나물',
  '닭갈비',
  '미역국',
  '고등어구이',
  '콩나물국',
  '잡채',
  '멸치볶음',
  '두부조림',
  '카레라이스',
  '떡갈비',
  '청포묵무침',
  '순두부찌개',
  '비빔밥',
  '고추장불고기',
  '계란찜',
  '도라지나물',
  '깍두기',
  '감자국',
  '닭볶음탕',
  '애호박볶음',
  '콩자반',
  '우엉조림',
  '파래무침',
  '어묵볶음',
  '참치김치볶음',
];

// 주어진 월의 평일(주말, 공휴일 제외) 날짜 리스트 생성
function getWeekdays(year: number, month: number): string[] {
  const result: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (!isWeekend && !isHoliday(key)) {
      result.push(key);
    }
  }
  return result;
}

// 3, 4, 5월 평일 날짜 모두 모으기
const allDates = [
  ...getWeekdays(2025, 2), // 3월
  ...getWeekdays(2025, 3), // 4월
  ...getWeekdays(2025, 4), // 5월
];

// 더미 데이터 생성
function getRandomMenu(): string[] {
  // 음식 이름 4개 랜덤 선택
  const shuffled = [...foodNames].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}
function getRandomWasteData(menu: string[]): WasteData[] {
  return menu.map((name) => ({ name, 잔반률: Math.floor(Math.random() * 7) * 5 + 5 })); // 5~35% 5단위
}

export const menuData: MenuDataType = Object.fromEntries(
  allDates.map((dateStr) => {
    const [, month, day] = dateStr.split('-');
    const menu = getRandomMenu();
    return [
      dateStr,
      {
        date: `${parseInt(month)}월 ${parseInt(day)}일`,
        menu,
        wasteData: getRandomWasteData(menu),
      },
    ];
  })
);

// 실시간 잔반률 데이터
export const foodWasteData: WasteData[] = [
  { name: '돈까스덮밥', 잔반률: 25 },
  { name: '가쓰오국', 잔반률: 15 },
  { name: '진미채', 잔반률: 10 },
  { name: '꽃맛살과일샐러드', 잔반률: 20 },
  { name: '무비트초절임', 잔반률: 30 },
];

// 기본 잔반률 데이터 (메뉴 정보가 없을 경우)
export const defaultWasteData: WasteData[] = [{ name: '정보 없음', 잔반률: 0 }];

// 기본 메뉴 (날짜에 맞는 메뉴가 없을 경우)
export const defaultMenu: string[] = ['메뉴 정보가 없습니다'];
