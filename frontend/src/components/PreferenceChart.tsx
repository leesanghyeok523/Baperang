import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WasteData } from '../data/menuData';

interface PreferenceChartProps {
  data: WasteData[]; // 초기 데이터로 사용됨
}

// 선호도 데이터 형식
interface PreferenceData {
  name: string;
  선호도: number;
}

// 차트에 표시할 기본 데이터
const DEFAULT_DATA: PreferenceData[] = [{ name: '데이터 로딩중', 선호도: 0 }];

const PreferenceChart: React.FC<PreferenceChartProps> = ({ data }) => {
  const [preferenceData, setPreferenceData] = useState<PreferenceData[]>(DEFAULT_DATA);
  const chartRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // 데이터를 선호도 형식으로 변환
  const convertToPreferenceData = (wasteData: WasteData[]): PreferenceData[] => {
    // 데이터가 비어있으면 기본 데이터 생성
    if (!wasteData || wasteData.length === 0) {
      return DEFAULT_DATA;
    }

    // 데이터 변환 및 선호도 값 확인
    const converted = wasteData.map((item) => ({
      name: item.name,
      선호도: item.선호도 ?? 0,
    }));

    return converted;
  };

  // 선호도 데이터 초기화 (props로 받은 데이터 사용)
  useEffect(() => {
    const newData = convertToPreferenceData(data);
    setPreferenceData(newData);

    // 차트 가시성 리셋 (새로운 데이터가 들어올 때 다시 보이게)
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 50);
  }, [data]);

  // 최대 선호도 값 찾기 (최대값이 5를 넘지 않도록 제한)
  const maxPreferenceValue = Math.min(
    5,
    Math.max(...preferenceData.map((item) => item.선호도), 0.1)
  );

  // 선호도 색상 결정 함수
  const getPreferenceFillColor = (entry: PreferenceData) => {
    // 선호도가 0인 경우에도 색상 지정
    if (entry.선호도 <= 0) return '#FFCACA';
    return entry.선호도 === maxPreferenceValue ? '#FF5252' : '#FF8A8A';
  };

  return (
    <div className="relative h-full w-full flex flex-col" ref={chartRef}>
      <div className="text-center mb-2">
        <span className="text-sm text-gray-500">
          {preferenceData.every((item) => item.선호도 === 0)
            ? '아직 만족도 데이터가 없습니다'
            : '메뉴별 만족도 점수 (5점 만점)'}
        </span>
      </div>

      {isVisible && (
        <div className="flex-1">
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
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tickFormatter={(value) => `${value}점`}
                tickMargin={10}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}점`, '선호도']}
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
                  formatter: (value: number) => `${value > 0 ? value.toFixed(1) : '0'}점`,
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
      )}
    </div>
  );
};

export default PreferenceChart;
