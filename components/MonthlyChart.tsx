import React, { useMemo } from 'react';
import type { SavedReport } from '../types';

interface MonthlyChartProps {
  reports: SavedReport[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ reports }) => {
  const chartData = useMemo(() => {
    const monthCounts: { [month: string]: number } = {};
    const monthOrder: string[] = [];
    const today = new Date();

    // Initialize the last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      monthOrder.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
      monthCounts[monthKey] = 0;
    }

    // Populate counts from reports
    reports.forEach(report => {
      if (report.occurrenceDateTime) {
        try {
            const reportDate = new Date(report.occurrenceDateTime);
            if(isNaN(reportDate.getTime())) return; // Skip invalid dates
            const reportMonthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthCounts.hasOwnProperty(reportMonthKey)) {
                monthCounts[reportMonthKey]++;
            }
        } catch(e) {
            console.error("Invalid occurrenceDateTime format:", report.occurrenceDateTime);
        }
      }
    });
    
    const data = monthOrder.map((label) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (monthOrder.length - 1 - monthOrder.indexOf(label)), 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        // Find the correct month key based on label
        const monthKey = Object.keys(monthCounts).find(k => {
            const date = new Date(k + '-02'); // Use day 2 to avoid timezone issues
            const lbl = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            return (lbl.charAt(0).toUpperCase() + lbl.slice(1)) === label;
        })
        return { label, count: monthKey ? monthCounts[monthKey] : 0 };
    });

    const maxCount = Math.max(...data.map(d => d.count), 1);

    return { data, maxCount };
  }, [reports]);

  if (reports.length === 0) {
    return null; // Don't render if no reports
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Ocorrências nos Últimos 6 Meses</h3>
      <div className="flex justify-around items-end h-32 w-full pt-4 border-l border-b border-gray-200">
        {chartData.data.map(({ label, count }) => (
          <div key={label} className="flex flex-col items-center w-1/6 group h-full">
            <div className="flex-grow flex items-end w-full justify-center">
                <div
                className="w-4/5 bg-emerald-400 hover:bg-emerald-500 rounded-t-sm transition-all duration-300 relative"
                style={{ height: `${(count / chartData.maxCount) * 100}%` }}
                title={`${count} ocorrência(s) em ${label}`}
                >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity block">{count > 0 ? count : ''}</span>
                </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 capitalize">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyChart;
