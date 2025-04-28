import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/Login/login';
import JoinPage from './pages/Join/join';
import Header from './components/Header';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지는 헤더 없이 렌더링 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 나머지 경로는 헤더와 함께 렌더링 */}
        <Route path="/" element={<Layout isLoggedIn={isLoggedIn} />}>
          <Route index element={<Navigate to="/login" />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="diet" element={<div>식단생성 페이지</div>} />
          <Route path="inventory" element={<div>재고관리 페이지</div>} />
          <Route path="mypage" element={<div>마이페이지</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
