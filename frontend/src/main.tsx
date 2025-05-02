import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// 개발 모드에서는 80%로, 배포 모드에서는 100%로 폰트 크기(=전체 배율)를 설정
if (import.meta.env.DEV) {
  document.documentElement.style.fontSize = '80%';
} else {
  document.documentElement.style.fontSize = '0%';
}

createRoot(document.getElementById('root')!).render(<App />);
