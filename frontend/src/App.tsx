import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/Login/login';
import JoinPage from './pages/Join/join';
import MainPage from './pages/Main';
import Calendar from './pages/Calendar';
import Header from './components/Header';
import InventoryPage from './pages/Inventory';
import MyPage from './pages/MyPage';
import CreateMeal from './pages/CreateMeal';
import ForgotAccountPage from './pages/ForgotAccount';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// 헤더를 포함하는 레이아웃 컴포넌트
const Layout = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Header isLoggedIn={isAuthenticated} />
      <main className="w-full h-full">
        <Outlet />
      </main>
    </>
  );
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* 인증이 필요하지 않은 페이지들 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/forgot" element={<ForgotAccountPage />} />

        {/* 인증이 필요한 경로들 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/main" />} />
            <Route path="main" element={<MainPage />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="diet" element={<CreateMeal />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="mypage" element={<MyPage />} />
          </Route>
        </Route>

        {/* 기본 경로 리다이렉트 */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/main' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
