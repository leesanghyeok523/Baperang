// 날짜별 식단 데이터 타입 정의
export interface MenuItem {
  date: string;
  menu: string[];
  wasteData?: WasteData[]; // 해당 날짜의 잔반률 데이터
}

export interface MenuDataType {
  [key: string]: MenuItem;
}

// 잔반률 및 선호도 데이터 타입 정의
export interface WasteData {
  name: string;
  잔반률: number;
  선호도?: number; // 선호도 필드 추가 (1-5 점수)
}

// 빈 메뉴 데이터
export const menuData: MenuDataType = {};

// 빈 잔반률 데이터
export const foodWasteData: WasteData[] = [];

// 기본 잔반률 데이터 (메뉴 정보가 없을 경우)
export const defaultWasteData: WasteData[] = [];

// 기본 메뉴 (날짜에 맞는 메뉴가 없을 경우)
export const defaultMenu: string[] = ['메뉴 정보가 없습니다'];
