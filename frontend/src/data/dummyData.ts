// 임시로 사용할 더미 데이터 (로그인 기능 구현 전까지 사용)
export const userData = {
  loginId: 'ssafy123',
  password: 'ssafy',
  nutritionistName: '김싸피',
  city: '부산',
  schoolName: '동아고등학교',
};

// 로그인 상태를 확인하는 함수 (실제 로그인 구현 전까지 항상 true 반환)
export const isLoggedIn = () => {
  return true;
};

// JWT 토큰을 가져오는 함수 (실제 로그인 구현 전까지 더미 토큰 반환)
export const getToken = () => {
  return 'dummy-jwt-token';
};
