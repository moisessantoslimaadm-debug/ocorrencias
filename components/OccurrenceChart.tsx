import React, { useMemo } from 'react';
import type { SavedReport } from '../types';
import { occurrenceTypeLabels } from '../constants';


const barColors = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
];

const OccurrenceChart: React.FC<{reports: SavedReport[]}> = ({ reports }) => {
  const chartData = useMemo(() => {
    const counts = Object.fromEntries(occurrenceTypeLabels.map(item => [item.key, 0]));

    reports.forEach(report => {
      if (report.occurrenceTypes) {
        for (const key in report.occurrenceTypes) {
          if (report.occurrenceTypes[key as keyof typeof report.occurrenceTypes]) {
            if (key in counts) {
                counts[key as keyof typeof counts]++;
            }
          }
        }
      }
    });
    
    const sortedData = occurrenceTypeLabels
      .map((item, index) => ({
        label: item.label,
        count: counts[item.key] || 0,
        color: barColors[index % barColors.length],
      }))
      .sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...sortedData.map(d => d.count), 1);

    return { sortedData, maxCount };

  }, [reports]);

  if (reports.length === 0) {
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Índice de Ocorrências</h3>
            <p className="text-sm">Nenhum dado de ocorrência para exibir.</p>
        </div>
    );
  }
  
  const { sortedData, maxCount } = chartData;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Índice de Ocorrências por Tipo</h3>
      <div className="space-y-3">
        {sortedData.map((item) => (
          <div key={item.label} className="grid grid-cols-3 items-center gap-2 text-sm">
            <span className="truncate text-gray-600 col-span-1" title={item.label}>
              {item.label}
            </span>
            <div className="col-span-2 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`absolute top-0 left-0 h-4 rounded-full ${item.color} transition-all duration-500 ease-out`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 font-semibold text-gray-700 w-6 text-right">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OccurrenceChart;