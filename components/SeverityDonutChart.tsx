import React, { useMemo } from 'react';
import type { SavedReport } from '../types';

interface SeverityDonutChartProps {
  reports: SavedReport[];
}

const SeverityDonutChart: React.FC<SeverityDonutChartProps> = ({ reports }) => {
  const chartData = useMemo(() => {
    const counts = {
      Leve: 0,
      Moderada: 0,
      Grave: 0,
      'N/D': 0,
    };

    reports.forEach(report => {
      const severity = report.occurrenceSeverity;
      if (severity === 'Leve') counts.Leve++;
      else if (severity === 'Moderada') counts.Moderada++;
      else if (severity === 'Grave') counts.Grave++;
      else counts['N/D']++;
    });

    const total = reports.length;
    return {
      total,
      leve: counts.Leve,
      moderada: counts.Moderada,
      grave: counts.Grave,
      na: counts['N/D'],
    };
  }, [reports]);

  if (chartData.total === 0) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center text-gray-500">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Análise de Gravidade</h3>
        <p className="text-sm">Nenhum dado para exibir.</p>
      </div>
    );
  }

  const gravePercent = (chartData.grave / chartData.total) * 100;
  const moderadaPercent = (chartData.moderada / chartData.total) * 100;

  const conicGradient = `conic-gradient(
    #ef4444 0% ${gravePercent}%,
    #f59e0b ${gravePercent}% ${gravePercent + moderadaPercent}%,
    #22c55e ${gravePercent + moderadaPercent}% 100%
  )`;
  
  const legendItems = [
      { label: 'Grave', count: chartData.grave, color: 'bg-red-500' },
      { label: 'Moderada', count: chartData.moderada, color: 'bg-yellow-500' },
      { label: 'Leve', count: chartData.leve, color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Análise de Gravidade</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div
            className="w-full h-full rounded-full"
            style={{ background: conicGradient }}
          ></div>
          <div className="absolute w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
                <span className="text-2xl font-bold text-gray-800">{chartData.total}</span>
                <span className="text-xs text-gray-500 block">Total</span>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-sm">
            {legendItems.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                        <span className="text-gray-700">{item.label}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SeverityDonutChart;
