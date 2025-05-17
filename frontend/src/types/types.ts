// 학생 관련 타입
export interface StudentInfo {
  gender: string;
  name: string;
  isTagged: boolean;
}

export interface StudentListResponse {
  students: {
    studentId: number;
    studentName: string;
    grade: number;
    classNum: number;
    number: number;
    gender: string;
  }[];
}

export interface StudentDetailResponse {
  studentId: number;
  studentName: string;
  grade: number;
  classNum: number;
  number: number;
  height: number;
  weight: number;
  date: string;
  content: string;
  schoolName: string;
}

export interface StudentType {
  id: number;
  name: string;
  grade: number;
  classNum: number;
  studentNum: number;
  number?: number;
  gender: string;
  bmi?: number;
  wasteRate?: number;
  height?: number;
  weight?: number;
  date?: string;
  content?: string;
  schoolName?: string;
}

// NFC 관련 타입
export interface NFCInfo {
  pk: string;
  grade: string;
  class: string;
  number: string;
  name: string;
  gender: string;
  status: string;
  isTagged: boolean;
}

// 인증 관련 타입
export interface User {
  userPk: number;
  loginId: string;
  nutritionistName: string;
  city: string;
  schoolName: string;
}

export interface LoginCredentials {
  loginId: string;
  password: string;
}

// 메뉴 관련 타입
export interface Menu {
  id: number;
  name: string;
  calories: number;
  category: string;
}

export interface MenuItem {
  menuId: number;
  menuName: string;
}

export interface DayMenuData {
  date: string;
  dayOfWeekName: string;
  menu: MenuItem[];
  holiday?: string[];
}

export interface MenuResponse {
  days: DayMenuData[];
}

export interface MenuDataType {
  [key: string]: MenuItem;
}

export interface DayData {
  date: string;
  dayOfWeekName: string;
  menu: MenuItem[];
  holiday?: string[];
}

export interface ApiResponse {
  days: DayData[];
}

// 잔반 데이터 관련 타입
export interface LeftoverData {
  dishName: string;
  wasteRate: number;
}

export interface DailyLeftoverResponse {
  date: string;
  leftoverRate: number;
  dishes: LeftoverData[];
}

export interface WeeklyLeftoverResponse {
  days: {
    date: string;
    leftoverRate: number;
  }[];
}

export interface MonthlyLeftoverResponse {
  days: {
    date: string;
    day: number;
    leftoverRate: number;
  }[];
}

export interface DailyWasteRate {
  date: string;
  day: number;
  wasteRate: number;
}

export interface DishWasteRate {
  name: string;
  잔반률: number;
}

export interface ChartClickData {
  activePayload?: Array<{
    payload: DailyWasteRate;
  }>;
}

// 학교 관련 타입
export interface City {
  name: string;
  id: number;
}

export interface School {
  name: string;
  id: number;
}

// 캘린더 관련 타입
export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  hasMenu: boolean;
  dateString: string;
}

// 메뉴 에디터 관련 타입
export interface MenuData {
  date: string;
  meals: string[];
}

// 만족도 조사 관련 타입
export interface SatisfactionUpdate {
  menuId: number;
  menuName: string;
  totalVotes: number;
  averageSatisfaction: string;
  updatedAt: string;
}

// 헤더 관련 타입
export interface HeaderProps {
  isLoggedIn: boolean;
}

// 메뉴카드 관련 타입
export interface MenuCardProps {
  menuItems: string[];
  currentDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  loading?: boolean;
  onMenuSelect?: (menuItem: string) => void;
}

// 영양정보 관련 타입
export interface NutritionInfoProps {
  selectedMenu: string | null;
  currentDate: Date;
}

export interface NutrientResponse {
  영양소: Record<string, string>;
  메뉴: string;
}

// 선호도 차트 관련 타입
export interface PreferenceChartProps {
  data: WasteData[];
}

export interface PreferenceData {
  name: string;
  선호도: number;
}

export interface WasteData {
  name: string;
  잔반률: number;
  선호도?: number;
}

// 잔반률 관련 타입
export interface WasteRateCardProps {
  data: WasteData[];
}

// 식사 완료율 관련 타입
export interface MealCompletionRateProps {
  completionRate: number; // 0-100 사이의 값
}

// 비율 토글 관련 타입
export interface RateToggleCardProps {
  data: WasteData[];
}

// 엑셀 내보내기 관련 타입
export interface ExcelExportProps {
  data: InventoryItem[];
  filename?: string;
}

export interface InventoryItem {
  id?: number;
  date: string;
  productName: string;
  supplier: string;
  price: number;
  orderedQuantity: number;
  usedQuantity: number;
  unit: string;
}

// 로그인 관련 타입
export interface LoginPageFormData {
  loginId: string;
  password: string;
}

// SSE 메시지 이벤트 타입
export interface SSEMessageEvent extends Event {
  data: string;
}

// 기타
export const parseMenuName = (menuName: string): string[] => {
  // <br/>, <br>, <BR/>, <BR> 등 다양한 형태의 br 태그 처리
  const regex = /<br\s*\/?>/gi;
  return menuName.split(regex).filter((item) => item.trim() !== '');
};

// 날짜별 식단 데이터 타입 정의
export interface MenuItem {
  date: string;
  menu: string[];
  wasteData?: WasteData[]; // 해당 날짜의 잔반률 데이터
}
