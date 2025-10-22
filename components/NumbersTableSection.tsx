import React from 'react';

interface NumberStat {
  number: number;
  streak: number;
  maxStreak: number;
  absence: number;
  maxAbsence: number;
  L9: number;
  L18: number;
  L27: number;
  L36: number;
  actualPercent: number;
  expectedPercent: number;
  deviation: number;
  temperature: 'HOT' | 'COLD' | 'NORMAL' | 'VERY HOT' | 'VERY COLD';
  justHit: boolean;
}

interface NumbersTableSectionProps {
  numbers: NumberStat[];
  highlight?: boolean;
}

const NumbersTableSection: React.FC<NumbersTableSectionProps> = ({ 
  numbers, 
  highlight = false 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-700 text-gray-300">
            <th className="text-left p-1">Num</th>
            <th className="text-center p-1" colSpan={2}>Streak</th>
            <th className="text-center p-1" colSpan={2}>Absence</th>
            <th className="text-center p-1">L9</th>
            <th className="text-center p-1">L18</th>
            <th className="text-center p-1">L27</th>
            <th className="text-center p-1">L36</th>
            <th className="text-center p-1">Act%</th>
            <th className="text-center p-1">Exp%</th>
            <th className="text-center p-1">Dev</th>
            <th className="text-center p-1">Status</th>
          </tr>
          <tr className="border-b border-gray-700 text-xs text-gray-400">
            <th></th>
            <th className="p-1">Now</th>
            <th className="p-1">Max</th>
            <th className="p-1">Now</th>
            <th className="p-1">Max</th>
            <th colSpan={8}></th>
          </tr>
        </thead>
        <tbody>
          {numbers.map(stat => (
            <tr 
              key={stat.number}
              className={`
                border-b border-gray-700
                ${highlight && stat.temperature === 'VERY HOT' ? 'bg-red-900/30' : ''}
                ${highlight && stat.temperature === 'HOT' ? 'bg-red-900/20' : ''}
                ${highlight && stat.temperature === 'COLD' ? 'bg-blue-900/20' : ''}
                ${highlight && stat.temperature === 'VERY COLD' ? 'bg-blue-900/30' : ''}
                ${stat.absence > 50 ? 'animate-pulse' : ''}
                ${stat.justHit ? 'bg-green-900/20' : ''}
              `}
            >
              <td className="p-1 font-bold">
                <span className={`
                  ${stat.number === 0 ? 'text-green-400' : 'text-gray-200'}
                `}>
                  {stat.number}
                </span>
              </td>
              <td className="p-1 text-center text-gray-200">{stat.streak}</td>
              <td className="p-1 text-center text-gray-400">{stat.maxStreak}</td>
              <td className="p-1 text-center">
                <span className={stat.absence > 40 ? 'text-yellow-400' : 'text-gray-200'}>
                  {stat.absence}
                  {stat.absence > 50 && ' ⚠️'}
                </span>
              </td>
              <td className="p-1 text-center text-gray-400">{stat.maxAbsence}</td>
              <td className="p-1 text-center text-gray-200">{stat.L9}</td>
              <td className="p-1 text-center text-gray-200">{stat.L18}</td>
              <td className="p-1 text-center text-gray-200">{stat.L27}</td>
              <td className="p-1 text-center text-gray-200">{stat.L36}</td>
              <td className="p-1 text-center text-gray-200">{stat.actualPercent.toFixed(1)}</td>
              <td className="p-1 text-center text-gray-400">2.7</td>
              <td className={`p-1 text-center ${
                stat.deviation > 10 ? 'text-red-400' :
                stat.deviation > 5 ? 'text-yellow-400' :
                stat.deviation < -10 ? 'text-blue-400' :
                stat.deviation < -5 ? 'text-cyan-400' :
                'text-gray-200'
              }`}>
                {stat.deviation > 0 ? '+' : ''}{stat.deviation.toFixed(1)}
              </td>
              <td className={`p-1 text-center font-bold ${
                stat.temperature === 'VERY HOT' ? 'text-red-500' :
                stat.temperature === 'HOT' ? 'text-red-400' :
                stat.temperature === 'COLD' ? 'text-blue-400' :
                stat.temperature === 'VERY COLD' ? 'text-blue-500' :
                'text-gray-300'
              }`}>
                {stat.temperature}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NumbersTableSection;