import React, { useMemo } from 'react';
import type { SavedReport } from '../types';

interface OccurrenceChartProps {
  reports: SavedReport[];
}

const occurrenceTypeLabelsMap: Record<string, string> = {
    physicalAssault: 'Agressão física',
    verbalAssault: 'Agressão verbal',
    bullying: 'Bullying',
    propertyDamage: 'Dano ao patrimônio',
    truancy: 'Fuga/abandono',
    socialRisk: 'Risco social',
    prohibitedSubstances: 'Substâncias proibidas',
    other: 'Outros',
};

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

const OccurrenceChart: React.FC<OccurrenceChartProps> = ({ reports }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};

    Object.keys(occurrenceTypeLabelsMap).forEach(key => {
        counts[key] = 0;
    });

    reports.forEach(report => {
      if (report.occurrenceTypes) {
        Object.entries(report.occurrenceTypes).forEach(([key, isChecked]) => {
          if (isChecked) {
            counts[key] = (counts[key] || 0) + 1;
          }
        });
      }
    });
    
    const sortedData = Object.entries(counts)
      .map(([key, count], index) => ({
        label: occurrenceTypeLabelsMap[key] || key,
        count,
        color: barColors[index % barColors.length],
      }))
      .filter(item => item.count > 0) // Only show items with count > 0
      .sort((a, b) => b.count - a.count);

    const maxCount = Math.max(...sortedData.map(d => d.count), 1);

    return { sortedData, maxCount };

  }, [reports]);

  if (reports.length === 0 || chartData.sortedData.length === 0) {
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
