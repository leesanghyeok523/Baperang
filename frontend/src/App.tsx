import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/Login/login';
import JoinPage from './pages/Join/join';
import MainPage from './pages/Main';
import Calendar from './pages/Calendar';
import Header from './components/Header';
import InventoryPage from './pages/Inventory';
import MyPage from './pages/MyPage';
import CreateMeal from './pages/CreateMeal';
import { isLoggedIn as checkLogin } from './data/dummyData';

// 헤더를 포함하는 레이아웃 컴포넌트
const Layout = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  return (
    <>
      <Header isLoggedIn={isLoggedIn} />
      <main className="w-full h-full">
        <Outlet />
      </main>
    </>
  );
};

function App() {
  // 실제 로그인 구현 전까지는 테스트용으로 항상 로그인된 상태로 설정
  const [isLoggedIn, setIsLoggedIn] = useState(checkLogin());

  // 로그인 상태 변경 시 메인 페이지로 리다이렉트하는 함수
  const handleLogin = () => {
    setIsLoggedIn(true);
    // 로그인 성공 시 localStorage에 토큰 저장 (실제 구현 시 이 부분 활성화)
    // localStorage.setItem('token', token);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지는 헤더 없이 렌더링 */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* 나머지 경로는 헤더와 함께 렌더링 */}
        <Route path="/" element={<Layout isLoggedIn={isLoggedIn} />}>
          <Route index element={<Navigate to={isLoggedIn ? '/main' : '/login'} />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="main" element={<MainPage />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="diet" element={<CreateMeal />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
