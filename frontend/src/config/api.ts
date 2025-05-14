// API 설정 파일
// 환경에 따라 API URL을 변경할 수 있습니다.

const API_CONFIG = {
  // 기본 API URL
  BASE_URL: '', // 프록시 사용 시 상대 경로 사용

  // API 엔드포인트
  ENDPOINTS: {
    // 회원 관리
    AUTH: {
      SIGNUP: '/api/v1/user/signup',
      LOGIN: '/api/v1/user/login',
      LOGOUT: '/api/v1/user/logout', // {userId} 파라미터 필요
      VALIDATE_ID: '/api/v1/user/validate-id',
      FIND_ID: '/api/v1/user/find-id',
      NEW_PASSWORD: '/api/v1/user/new-password',
      USER_INFO: '/api/v1/user/users', // /{user-id} 파라미터 필요
      MYPAGE: '/api/v1/user/profile',
      REFRESH_TOKEN: '/api/v1/user/refresh-token',
      DELETE_USER: '/api/v1/user/users',
    },

    // 식단 관리
    MEAL: {
      DAILY_LEFTOVER: '/api/v1/leftover/date', // /{date} 파라미터 필요
      WEEKLY_LEFTOVER: '/api/v1/leftover/week', // /{startDate}/{endDate} 파라미터 필요
      MONTHLY_LEFTOVER: '/api/v1/leftover/month', // /{year}/{month} 파라미터 필요
      MENU_CALENDAR: '/api/v1/menu/calendar', // ?year={year}&month={month} 쿼리 필요
      TODAY_MENU: '/api/v1/menu/today',
      AI_SUGGESTION: '/api/v1/menu/suggestion',
      UPDATE_SUGGESTION: '/api/v1/menu/suggestion', // /{date} 파라미터 필요
      MENU_FAVORITE: '/api/v1/menu/favorite',
      MONTHLY_WASTE: '/api/v1/menu/leftover/month', // /{year}/{month} 파라미터 필요
      DAILY_DISH_WASTE: '/api/v1/menu/leftover/date', // /{date} 파라미터 필요
    },

    // 학생 관리
    STUDENT: {
      GET_ALL: '/api/v1/student/studentname/all',
      GET_STUDENT_DETAIL: '/api/v1/student/studentname', // /{studentId} 파라미터 필요
    },

    // 학교 관련
    SCHOOL: {
      CITIES: '/api/v1/school/cities',
      SCHOOLS: '/api/v1/school/schools',
    },

    // AI 관련
    AI: {
      TRAY_DEFAULT: '/api/v1/ai/tray/default',
      TRAY_START: '/api/v1/ai/tray/start',
      TRAY_END: '/api/v1/ai/tray/end',
      LEFTOVER_MEASURE: '/api/v1/ai/leftover/measure',
    },

    // 만족도 조사 관련 (SSE)
    SATISFACTION: {
      VOTE: '/api/v1/sse/vote',
      SUBSCRIBE: '/api/v1/sse/subscribe',
    },
  },

  // API URL 생성 도우미 함수
  getUrl: function (endpoint: string, params?: Record<string, string>): string {
    let url = `${this.BASE_URL}${endpoint}`;

    // URL 파라미터 추가
    if (params) {
      const paramEntries = Object.entries(params);
      if (paramEntries.length > 0) {
        const queryParams = paramEntries
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        url = `${url}?${queryParams}`;
      }
    }

    return url;
  },

  // 경로 파라미터가 있는 URL 생성 함수
  getUrlWithPathParams: function (endpoint: string, pathParams: string[]): string {
    const pathParamsStr = pathParams.map((param) => `/${param}`).join('');
    return `${this.BASE_URL}${endpoint}${pathParamsStr}`;
  },
};

export default API_CONFIG;
