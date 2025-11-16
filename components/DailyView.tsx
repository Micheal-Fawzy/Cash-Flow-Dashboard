import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { Transaction } from '../types.ts';
import { CASH_INFLOW_CATEGORIES } from '../constants.ts';
import { EditableCell } from './EditableCell.tsx';

interface DailyViewProps {
  selectedDate: Date;
  transactions: Transaction[];
  onTransactionChange: (date: string, category: string, amount: number) => void;
  outflowCategories: string[];
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const formatNumber = (num: number) => {
    if (num === 0) return "-";
    // Format with up to 2 decimal places for averages
    return new Intl.NumberFormat('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
};

const calculatePeriodTotal = (data: number[], start: number, end: number) => {
    return data.slice(start, end).reduce((sum, value) => sum + value, 0);
};

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const DailyView: React.FC<DailyViewProps> = ({ selectedDate, transactions, onTransactionChange, outflowCategories }) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const tableEl = tableRef.current;
    if (tableEl) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setTableWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(tableEl);
        
        return () => {
          if (tableEl) {
            resizeObserver.unobserve(tableEl);
          }
        };
    }
  }, []);
  
  useEffect(() => {
      const topScroll = topScrollbarRef.current;
      const mainScroll = tableContainerRef.current;

      if (!topScroll || !mainScroll) return;
      
      let ignoreScroll = false;

      const handleTopScroll = () => {
          if (ignoreScroll) {
              ignoreScroll = false;
              return;
          }
          ignoreScroll = true;
          mainScroll.scrollLeft = topScroll.scrollLeft;
      };
      
      const handleMainScroll = () => {
          if (ignoreScroll) {
              ignoreScroll = false;
              return;
          }
          ignoreScroll = true;
          topScroll.scrollLeft = mainScroll.scrollLeft;
      };

      topScroll.addEventListener('scroll', handleTopScroll);
      mainScroll.addEventListener('scroll', handleMainScroll);

      return () => {
          topScroll.removeEventListener('scroll', handleTopScroll);
          mainScroll.removeEventListener('scroll', handleMainScroll);
      };
  }, []);

  const transactionsMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      map.set(`${t.date}-${t.category}`, t.amount);
    });
    return map;
  }, [transactions]);

  const getTransactionValue = (day: number, category: string) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return transactionsMap.get(`${date}-${category}`) || 0;
  };
  
  const calculateDailyTotals = (day: number, categories: string[]) => {
      return categories.reduce((sum, category) => sum + getTransactionValue(day, category), 0);
  };
  
  const dailyInflows = days.map(day => calculateDailyTotals(day, CASH_INFLOW_CATEGORIES));
  const dailyOutflows = days.map(day => calculateDailyTotals(day, outflowCategories));
  const dailyNetFlow = days.map((_, index) => dailyInflows[index] - dailyOutflows[index]);
  
  const cumulativeBalance = days.reduce<number[]>((acc, _, index) => {
      const prevBalance = index > 0 ? acc[index - 1] : 0;
      acc.push(prevBalance + dailyNetFlow[index]);
      return acc;
  }, []);

  const dailyAverages = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    outflowCategories.forEach(cat => {
        categoryTotals[cat] = 0;
    });

    transactions.forEach(t => {
        if (outflowCategories.includes(t.category)) {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
    });

    const averages: { [key: string]: number } = {};
    let totalSpent = 0;

    outflowCategories.forEach(cat => {
        const total = categoryTotals[cat] || 0;
        averages[cat] = total / daysInMonth;
        totalSpent += total;
    });

    const overallAverage = totalSpent / daysInMonth;

    return { individual: averages, overall: overallAverage };
  }, [transactions, outflowCategories, daysInMonth]);

  const renderSection = (title: string, categories: string[]) => (
    <>
      <tr className="bg-teal-100 dark:bg-teal-900/50 sticky top-16 z-[2]">
        <th className="font-bold text-right p-2 whitespace-nowrap sticky right-0 bg-teal-100 dark:bg-teal-900/50 z-[3]">{title}</th>
        <td colSpan={days.length + 3} className="p-0"></td>
      </tr>
      {categories.map(category => (
        <tr key={category} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/50">
          <td className="text-right p-2 pr-4 sticky right-0 bg-white dark:bg-gray-800 whitespace-nowrap z-[3]">{category}</td>
          {days.map(day => {
             const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
             return (
              <td key={day} className="p-0 text-center text-sm">
                <EditableCell
                  value={getTransactionValue(day, category)}
                  onSave={(newValue) => onTransactionChange(dateStr, category, newValue)}
                />
              </td>
            )
          })}
          {/* Summary Cells */}
          <td className="p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500">{formatNumber(calculatePeriodTotal(days.map(d => getTransactionValue(d, category)), 0, 10))}</td>
          <td className="p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500">{formatNumber(calculatePeriodTotal(days.map(d => getTransactionValue(d, category)), 10, 20))}</td>
          <td className="p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500">{formatNumber(calculatePeriodTotal(days.map(d => getTransactionValue(d, category)), 20, daysInMonth))}</td>
        </tr>
      ))}
    </>
  );

  const renderTotalsRow = (title: string, data: number[], isBold: boolean = false, isNegativeRed: boolean = false) => (
     <tr className={`
      ${isBold ? 'bg-blue-100 dark:bg-blue-900/50 font-bold' : 'bg-gray-100 dark:bg-gray-800'}
      border-b border-gray-200 dark:border-gray-700`}>
        <td className={`text-right p-2 pr-4 sticky right-0 whitespace-nowrap z-[3] ${isBold ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>{title}</td>
        {data.map((value, index) => (
          <td key={index} className={`p-2 text-center text-sm ${isNegativeRed && value < 0 ? 'text-red-500' : ''}`}>
              {formatNumber(value)}
          </td>
        ))}
        {/* Summary Cells */}
        <td className={`p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500 ${isNegativeRed && calculatePeriodTotal(data, 0, 10) < 0 ? 'text-red-500' : ''}`}>{formatNumber(calculatePeriodTotal(data, 0, 10))}</td>
        <td className={`p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500 ${isNegativeRed && calculatePeriodTotal(data, 10, 20) < 0 ? 'text-red-500' : ''}`}>{formatNumber(calculatePeriodTotal(data, 10, 20))}</td>
        <td className={`p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500 ${isNegativeRed && calculatePeriodTotal(data, 20, daysInMonth) < 0 ? 'text-red-500' : ''}`}>{formatNumber(calculatePeriodTotal(data, 20, daysInMonth))}</td>
     </tr>
  );

  return (
    <>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div ref={topScrollbarRef} className="overflow-x-auto overflow-y-hidden h-3">
                <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
            </div>
            <div ref={tableContainerRef} className="overflow-x-auto">
                <table ref={tableRef} className="w-full border-collapse" style={{ minWidth: `${200 + (daysInMonth * 112) + (3 * 120)}px` }}>
                    <thead className="sticky top-0 z-[4]">
                    <tr className="bg-gray-200 dark:bg-gray-700 text-sm">
                        <th className="text-right p-2 sticky right-0 bg-gray-200 dark:bg-gray-700 min-w-[200px] z-[5] align-middle">البند / اليوم</th>
                        {days.map(day => {
                        const date = new Date(year, month, day);
                        const dayName = ARABIC_DAYS[date.getDay()];
                        return (
                            <th key={day} className="p-2 w-28 min-w-[112px]">
                            <div className="flex flex-col items-center justify-center">
                                <span className="font-semibold text-base">{day}</span>
                                <span className="text-xs font-normal text-gray-600 dark:text-gray-400 mt-1">{dayName}</span>
                            </div>
                            </th>
                        );
                        })}
                        {/* Summary Headers */}
                        <th className="p-2 bg-teal-600 text-white min-w-[120px] border-l-2 border-r-2 border-teal-400 dark:border-teal-500 align-middle">الفترة 1-10</th>
                        <th className="p-2 bg-teal-600 text-white min-w-[120px] border-l-2 border-r-2 border-teal-400 dark:border-teal-500 align-middle">الفترة 11-20</th>
                        <th className="p-2 bg-teal-600 text-white min-w-[120px] border-l-2 border-r-2 border-teal-400 dark:border-teal-500 align-middle">{`الفترة 21-${daysInMonth}`}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {renderSection('التدفقات النقدية الداخلة', CASH_INFLOW_CATEGORIES)}
                    {renderTotalsRow('إجمالي الإيصالات', dailyInflows, true)}
                    {renderSection('التدفقات النقدية الخارجة', outflowCategories)}
                    {renderTotalsRow('إجمالي المدفوعات', dailyOutflows, true)}
                    {renderTotalsRow('صافي التدفق النقدي', dailyNetFlow, false, true)}
                    <tr className="bg-green-100 dark:bg-green-900/50 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                        <td className="text-right p-2 pr-4 sticky right-0 bg-green-100 dark:bg-green-900/50 whitespace-nowrap z-[3]">الرصيد الختامي / التراكمي</td>
                        {cumulativeBalance.map((value, index) => (
                            <td key={index} className={`p-2 text-center text-sm ${value < 0 ? 'text-red-500' : 'text-green-700 dark:text-green-400'}`}>
                            {formatNumber(value)}
                            </td>
                        ))}
                        {/* Summary Cells */}
                        <td className={`p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500 ${cumulativeBalance.length > 9 && cumulativeBalance[9] < 0 ? 'text-red-500' : 'text-green-700 dark:text-green-400'}`}>{formatNumber(cumulativeBalance[9])}</td>
                        <td className={`p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500 ${cumulativeBalance.length > 19 && cumulativeBalance[19] < 0 ? 'text-red-500' : 'text-green-700 dark:text-green-400'}`}>{formatNumber(cumulativeBalance[19])}</td>
                        <td className={`p-2 text-center text-sm font-semibold bg-teal-100 dark:bg-teal-900/50 border-l-2 border-r-2 border-teal-400 dark:border-teal-500 ${cumulativeBalance.length > 0 && cumulativeBalance[daysInMonth - 1] < 0 ? 'text-red-500' : 'text-green-700 dark:text-green-400'}`}>{formatNumber(cumulativeBalance[daysInMonth - 1])}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-teal-600 dark:text-teal-400">
                متوسط الإنفاق اليومي لهذا الشهر
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المتوسط اليومي للمصروفات</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(dailyAverages.overall)}
                    </p>
                </div>
                {outflowCategories.map(category => (
                    <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 truncate" title={category}>{category}</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">
                            {formatNumber(dailyAverages.individual[category])}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    </>
  );
};