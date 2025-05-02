import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WasteData } from '../data/menuData';

interface WasteRateCardProps {
  data: WasteData[];
}

const WasteRateCard: React.FC<WasteRateCardProps> = ({ data }) => {
  // 최대 잔반률 값 찾기
  const maxValue = Math.max(...data.map((item) => item.잔반률));

  // 색상 결정 함수
  const getFillColor = (entry: WasteData) => {
    return entry.잔반률 === maxValue ? '#FF7814' : '#CF722C';
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 20,
          }}
        >
          <XAxis dataKey="name" type="category" tick={{ fontSize: 20 }} tickMargin={10} />
          <YAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tickMargin={10}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, '잔반률']}
            contentStyle={{ backgroundColor: 'white', borderRadius: '4px' }}
          />
          <Bar
            dataKey="잔반률"
            radius={[15, 15, 0, 0]}
            barSize={90}
            label={{
              position: 'top',
              fill: '#333',
              formatter: (value: number) => `${value}%`,
              dy: -10,
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getFillColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WasteRateCard;
