import React, { useState } from 'react';
import styled from 'styled-components';
import LoadingAnimation from './LoadingAnimation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 2rem;
`;

const Button = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #45a049;
  }
`;

const Content = styled.div`
  width: 100%;
  max-width: 600px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: #f9f9f9;
  padding: 1rem;
`;

const LoadingExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateClick = () => {
    setIsLoading(true);
    // 실제 프로젝트에서는 API 호출 등을 여기서 처리
    setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5초 후에 로딩 상태 해제
  };

  return (
    <Container>
      <Button onClick={handleGenerateClick} disabled={isLoading}>
        {isLoading ? '생성 중...' : '식단 생성하기'}
      </Button>
      <Content>
        {isLoading ? (
          <LoadingAnimation message="식단 생성중입니다..." />
        ) : (
          <div>여기에 생성된 식단 내용이 표시됩니다.</div>
        )}
      </Content>
    </Container>
  );
};

export default LoadingExample;
