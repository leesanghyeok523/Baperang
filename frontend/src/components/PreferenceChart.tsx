import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WasteData } from '../data/menuData';
import { useAuthStore } from '../store/authStore';

interface PreferenceChartProps {
  data: WasteData[]; // 초기 데이터로 사용됨
  autoUpdate?: boolean; // 실시간 업데이트 활성화 여부
  surveyClosed?: boolean; // 설문 마감 여부
}

interface PreferenceData {
  name: string;
  선호도: number;
}

// 모의 SSE 데이터 (백엔드 연결 전 테스트용)
const mockSseData: WasteData[] = [
  { name: '비빔밥', 잔반률: 25 },
  { name: '김치찌개', 잔반률: 15 },
  { name: '된장찌개', 잔반률: 30 },
  { name: '불고기', 잔반률: 10 },
  { name: '잡채', 잔반률: 20 },
];

const PreferenceChart: React.FC<PreferenceChartProps> = ({
  data,
  autoUpdate = true,
  surveyClosed = false,
}) => {
  const [preferenceData, setPreferenceData] = useState<PreferenceData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const mockSseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isAuthenticated } = useAuthStore();

  // 데이터를 선호도 형식으로 변환
  const convertToPreferenceData = (wasteData: WasteData[]): PreferenceData[] => {
    return wasteData.map((item) => ({
      name: item.name,
      선호도: 100 - item.잔반률,
    }));
  };

  // 선호도 데이터 초기화 (props로 받은 데이터 사용)
  useEffect(() => {
    setPreferenceData(convertToPreferenceData(data));
  }, [data]);

  // 모의 SSE 연결 설정
  useEffect(() => {
    // 자동 업데이트가 비활성화되었거나 설문이 마감된 경우 연결하지 않음
    if (!autoUpdate || surveyClosed) {
      return;
    }

    // 실제 SSE 연결 대신 모의 데이터 사용 (백엔드 API 구현 전까지)
    const setupMockSseConnection = () => {
      // 연결 상태 표시
      setIsConnected(true);
      setLastUpdateTime(new Date().toLocaleTimeString());
      console.log('모의 SSE 연결됨: 임시 데이터로 실시간 업데이트 시뮬레이션');

      // 일정 시간마다 랜덤 데이터 업데이트하여 실시간 업데이트 시뮬레이션
      mockSseIntervalRef.current = setInterval(() => {
        // 임의의 메뉴 선택하여 잔반률 변경
        const randomIndex = Math.floor(Math.random() * mockSseData.length);
        const updatedMockData = [...mockSseData];

        // 잔반률을 5~35% 사이의 값으로 랜덤하게 변경
        updatedMockData[randomIndex] = {
          ...updatedMockData[randomIndex],
          잔반률: Math.floor(Math.random() * 7) * 5 + 5,
        };

        // 개별 항목 업데이트 (실제 SSE 이벤트 처리와 유사)
        const updatedItem = updatedMockData[randomIndex];

        setPreferenceData((prevData) => {
          const newData = [...prevData];
          const existingIndex = newData.findIndex((item) => item.name === updatedItem.name);

          if (existingIndex >= 0) {
            // 기존 항목 업데이트
            newData[existingIndex] = {
              name: updatedItem.name,
              선호도: 100 - updatedItem.잔반률,
            };
          } else {
            // 새 항목 추가
            newData.push({
              name: updatedItem.name,
              선호도: 100 - updatedItem.잔반률,
            });
          }

          return newData;
        });

        setLastUpdateTime(new Date().toLocaleTimeString());
        console.log('모의 데이터 업데이트:', updatedItem);
      }, 3000); // 3초마다 업데이트
    };

    // 모의 연결 시작
    setupMockSseConnection();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (mockSseIntervalRef.current) {
        clearInterval(mockSseIntervalRef.current);
      }
      setIsConnected(false);
      console.log('모의 SSE 연결 종료');
    };
  }, [autoUpdate, surveyClosed, isAuthenticated]);

  // 최대 선호도 값 찾기
  const maxPreferenceValue = Math.max(...preferenceData.map((item) => item.선호도));

  // 선호도 색상 결정 함수
  const getPreferenceFillColor = (entry: PreferenceData) => {
    return entry.선호도 === maxPreferenceValue ? '#FF5252' : '#FF8A8A';
  };

  return (
    <div className="relative h-full w-full">
      {/* 연결 상태 표시 */}
      <div className="absolute top-2 right-4 flex items-center text-xs text-gray-500">
        <div
          className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span>{isConnected ? '실시간 연결됨' : '연결 끊김'}</span>
        {lastUpdateTime && <span className="ml-2">마지막 업데이트: {lastUpdateTime}</span>}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={preferenceData}
          margin={{
            top: 30,
            right: 20,
            left: 20,
            bottom: 0,
          }}
        >
          <XAxis dataKey="name" type="category" tick={{ fontSize: 14 }} tickMargin={10} />
          <YAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tickMargin={10}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, '선호도']}
            contentStyle={{ backgroundColor: 'white', borderRadius: '4px' }}
          />
          <Bar
            dataKey="선호도"
            radius={[15, 15, 0, 0]}
            barSize={80}
            label={{
              position: 'top',
              fill: '#333',
              fontSize: 12,
              formatter: (value: number) => `${value}%`,
              dy: -1,
            }}
          >
            {preferenceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getPreferenceFillColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PreferenceChart;
