import React, { useRef } from 'react';
import type { View } from '../App.tsx';
import { MONTHS } from '../constants.ts';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  logo: string | null;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ArrowLeftIcon: React.FC<{className: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ArrowRightIcon: React.FC<{className: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const DownloadIcon: React.FC<{className: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const UploadIcon: React.FC<{className: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const ImageIcon: React.FC<{className: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, selectedDate, onDateChange, onImport, onExport, logo, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    onDateChange(newDate);
  };

  const handleYearChange = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + increment);
    onDateChange(newDate);
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 sticky top-0 z-10">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            <input
                type="file"
                ref={logoInputRef}
                onChange={onLogoChange}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, image/gif"
            />
            <button
                onClick={handleLogoClick}
                className="flex-shrink-0 w-24 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                aria-label="Change company logo"
            >
                {logo ? (
                    <img src={logo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                )}
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-teal-600 dark:text-teal-400">لوحة تحكم التدفق النقدي</h1>
        </div>
        
        {(currentView === 'daily' || currentView === 'monthly' || currentView === 'budget') && (
            <div className="flex items-center gap-2 sm:gap-4 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <div className="flex items-center gap-1">
                <button onClick={() => handleYearChange(-1)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><ArrowRightIcon className="w-5 h-5" /></button>
                <span className="font-semibold w-12 text-center">{selectedDate.getFullYear()}</span>
                <button onClick={() => handleYearChange(1)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><ArrowLeftIcon className="w-5 h-5" /></button>
              </div>
              {(currentView === 'daily' || currentView === 'budget') && (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><ArrowRightIcon className="w-5 h-5" /></button>
                  <span className="font-semibold w-20 text-center">{MONTHS[selectedDate.getMonth()]}</span>
                  <button onClick={() => handleMonthChange(1)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><ArrowLeftIcon className="w-5 h-5" /></button>
                </div>
              )}
            </div>
        )}

        <div className="flex items-center gap-2">
          <nav className="flex gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setCurrentView('daily')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                currentView === 'daily' ? 'bg-teal-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              العرض اليومي
            </button>
            <button
              onClick={() => setCurrentView('monthly')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                currentView === 'monthly' ? 'bg-teal-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              الملخص الشهري
            </button>
            <button
              onClick={() => setCurrentView('budget')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                currentView === 'budget' ? 'bg-teal-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              الميزانية
            </button>
            <button
              onClick={() => setCurrentView('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                currentView === 'all' ? 'bg-teal-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              سجل المعاملات
            </button>
          </nav>
           <input
                type="file"
                ref={fileInputRef}
                onChange={onImport}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
            />
            <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Import from Excel"
            >
                <UploadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">استيراد</span>
            </button>
           <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Export to Excel"
            >
                <DownloadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">تصدير إكسل</span>
            </button>
        </div>
      </div>
    </header>
  );
};