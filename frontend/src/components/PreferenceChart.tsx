import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WasteData } from '../data/menuData';

interface PreferenceChartProps {
  data: WasteData[]; // 초기 데이터로 사용됨
}

interface PreferenceData {
  name: string;
  선호도: number;
}

const PreferenceChart: React.FC<PreferenceChartProps> = ({ data }) => {
  const [preferenceData, setPreferenceData] = useState<PreferenceData[]>([]);

  // 데이터를 선호도 형식으로 변환
  const convertToPreferenceData = (wasteData: WasteData[]): PreferenceData[] => {
    return wasteData.map((item) => ({
      name: item.name,
      선호도: convertToScore(100 - item.잔반률),
    }));
  };

  // 백분율을 1-5 점수로 변환하는 함수
  const convertToScore = (percentage: number): number => {
    if (percentage >= 90) return 5;
    if (percentage >= 70) return 4;
    if (percentage >= 50) return 3;
    if (percentage >= 30) return 2;
    return 1;
  };

  // 선호도 데이터 초기화 (props로 받은 데이터 사용)
  useEffect(() => {
    setPreferenceData(convertToPreferenceData(data));
  }, [data]);

  // 최대 선호도 값 찾기
  const maxPreferenceValue = Math.max(...preferenceData.map((item) => item.선호도), 0);

  // 선호도 색상 결정 함수
  const getPreferenceFillColor = (entry: PreferenceData) => {
    return entry.선호도 === maxPreferenceValue ? '#FF5252' : '#FF8A8A';
  };

  return (
    <div className="relative h-full w-full">
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
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(value) => `${value}점`}
            tickMargin={10}
          />
          <Tooltip
            formatter={(value) => [`${value}점`, '선호도']}
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
              formatter: (value: number) => `${value}점`,
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
