import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WasteData } from '../data/menuData';

interface PreferenceChartProps {
  data: WasteData[];
}

interface PreferenceData {
  name: string;
  선호도: number;
}

const PreferenceChart: React.FC<PreferenceChartProps> = ({ data }) => {
  // 선호도 데이터 생성 (잔반률에서 역산)
  const preferenceData = data.map((item) => ({
    name: item.name,
    선호도: 100 - item.잔반률,
  }));

  // 최대 선호도 값 찾기
  const maxPreferenceValue = Math.max(...preferenceData.map((item) => item.선호도));

  // 선호도 색상 결정 함수
  const getPreferenceFillColor = (entry: PreferenceData) => {
    return entry.선호도 === maxPreferenceValue ? '#FF5252' : '#FF8A8A';
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={preferenceData}
        margin={{
          top: 30,
          right: 20,
          left: 20,
          bottom: 20,
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
  );
};

export default PreferenceChart;
