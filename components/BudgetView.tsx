import React, { useState, useMemo, useEffect } from 'react';
import type { Transaction, Budgets } from '../types.ts';
import { MONTHS } from '../constants.ts';

interface BudgetViewProps {
  budgets: Budgets;
  onBudgetChange: (category: string, amount: number) => void;
  monthlyTransactions: Transaction[];
  selectedDate: Date;
  outflowCategories: string[];
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ar-EG').format(num);
};

const evaluateExpression = (expr: string): number | null => {
    // Only allow numbers, operators, and parentheses.
    const sanitizedExpr = String(expr).replace(/[^0-9+\-*/().]/g, '');
    if (sanitizedExpr.trim() === '') return 0;
    try {
        const result = new Function(`return ${sanitizedExpr}`)();
        if (typeof result === 'number' && isFinite(result)) {
            return result;
        }
        return null;
    } catch (e) {
        const num = parseFloat(sanitizedExpr);
        return isNaN(num) ? null : num;
    }
};

const EditableBudgetValue: React.FC<{ value: number; onSave: (value: number) => void }> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(value));

  useEffect(() => {
    if (!isEditing) {
        setCurrentValue(String(value));
    }
  }, [value, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const evaluated = evaluateExpression(currentValue);
    const numericValue = evaluated !== null ? (evaluated >= 0 ? evaluated : 0) : 0; // Budgets cannot be negative
    if (numericValue !== value) {
      onSave(numericValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setCurrentValue(String(value));
      setIsEditing(false);
    }
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div className="flex items-center justify-center gap-2 w-full" onClick={() => !isEditing && setIsEditing(true)}>
      <span className="font-semibold text-base text-gray-600 dark:text-gray-400">الميزانية:</span>
      {isEditing ? (
        <input
          type="text"
          value={currentValue === '0' ? '' : currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          autoFocus
          className="w-28 text-lg text-center font-bold bg-gray-200 dark:bg-gray-700 border-none rounded-md outline-none focus:ring-2 focus:ring-teal-500 p-1"
        />
      ) : (
        <span className="cursor-pointer font-bold text-lg text-teal-600 dark:text-teal-400 p-1 w-28 text-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
          {formatNumber(value)}
        </span>
      )}
    </div>
  );
};

const CircularProgress: React.FC<{ progress: number; colorClass: string }> = ({ progress, colorClass }) => {
    const radius = 45;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const visualProgress = Math.min(progress, 100); 
    const strokeDashoffset = circumference - (visualProgress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto my-4">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="-rotate-90"
            >
                <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth={stroke}
                    stroke="currentColor"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    className={`${colorClass} transition-all duration-500`}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <span className={`absolute text-2xl font-bold ${progress > 100 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                {`${Math.round(progress)}%`}
            </span>
        </div>
    );
};

const WarningIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "inline-block w-5 h-5 mr-2 text-red-500"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const PencilIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const BudgetCard: React.FC<{
  category: string;
  budget: number;
  spent: number;
  onBudgetChange: (category: string, amount: number) => void;
  onRemoveCategory: (name: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
}> = ({ category, budget, spent, onBudgetChange, onRemoveCategory, onEditCategory }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category);

  const remaining = budget - spent;
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = progress > 100;

  useEffect(() => {
    setEditedName(category);
  }, [category]);

  const handleSaveName = () => {
    if (editedName.trim() && editedName.trim() !== category) {
      onEditCategory(category, editedName.trim());
    }
    setIsEditing(false);
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
      if(e.key === 'Enter') handleSaveName();
      if(e.key === 'Escape') {
          setEditedName(category);
          setIsEditing(false);
      }
  }

  const getProgressColorClass = () => {
    if (isOverBudget) return 'text-red-500';
    if (progress > 85) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const colorClass = getProgressColorClass();

  return (
    <div className={`
      bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between gap-4 transition-all duration-300 relative group
      ${isOverBudget ? 'border border-red-500/50 bg-red-500/5 dark:bg-red-500/10' : ''}
    `}>
      <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setIsEditing(true)} className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full text-gray-600 dark:text-gray-300" aria-label={`تعديل ${category}`}><PencilIcon /></button>
          <button onClick={() => onRemoveCategory(category)} className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-red-200 dark:hover:bg-red-800 rounded-full text-gray-600 dark:text-gray-300" aria-label={`حذف ${category}`}><TrashIcon /></button>
      </div>
      <div>
        <div className="text-xl font-bold text-gray-800 dark:text-gray-200 text-center flex items-center justify-center h-8">
            {isOverBudget && !isEditing && <WarningIcon className="w-5 h-5 ml-2 text-red-500" />}
            {isEditing ? (
                 <input 
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={handleNameKeyDown}
                    autoFocus
                    className="w-full text-center bg-gray-200 dark:bg-gray-700 rounded-md outline-none focus:ring-2 focus:ring-teal-500 p-1"
                 />
            ) : (
                <span>{category}</span>
            )}
        </div>
        <p className={`text-sm text-center mb-2 ${isOverBudget ? 'font-bold text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            أنفقت: {formatNumber(spent)} / {formatNumber(budget)}
        </p>
      </div>

      <CircularProgress progress={progress} colorClass={colorClass} />
      
      <div className="flex flex-col items-center gap-4">
          <EditableBudgetValue value={budget} onSave={(newAmount) => onBudgetChange(category, newAmount)} />
          <div className="w-full text-center">
            <span className="text-lg font-semibold">
              المتبقي:
              <span className={`mr-2 ${remaining < 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                {formatNumber(remaining)}
              </span>
            </span>
          </div>
      </div>
    </div>
  );
};


const AddCategoryCard: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
    const [name, setName] = useState('');
    
    const handleAdd = () => {
        if (name.trim()) {
            onAdd(name.trim());
            setName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 rounded-xl flex flex-col items-center justify-center gap-4 min-h-[380px]">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">إضافة بند جديد</h3>
            <input 
                type="text"
                placeholder="اسم البند"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 focus:ring-teal-500 focus:border-teal-500 text-center"
            />
            <button onClick={handleAdd} className="w-full p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-semibold">
                إضافة
            </button>
        </div>
    );
};

export const BudgetView: React.FC<BudgetViewProps> = ({ budgets, onBudgetChange, monthlyTransactions, selectedDate, outflowCategories, onAddCategory, onRemoveCategory, onEditCategory }) => {
  const spendingByCategory = useMemo(() => {
    const spending: { [key: string]: number } = {};
    outflowCategories.forEach(cat => spending[cat] = 0);
    
    monthlyTransactions.forEach(t => {
      if (outflowCategories.includes(t.category)) {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      }
    });
    return spending;
  }, [monthlyTransactions, outflowCategories]);

  const overall = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    outflowCategories.forEach(cat => {
      totalBudget += budgets[cat] || 0;
      totalSpent += spendingByCategory[cat] || 0;
    });
    return {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent
    };
  }, [budgets, spendingByCategory, outflowCategories]);

  const overallProgress = overall.totalBudget > 0 ? (overall.totalSpent / overall.totalBudget) * 100 : 0;
  const isOverallOverBudget = overallProgress > 100;

  const getOverallProgressColorClass = () => {
    if (isOverallOverBudget) return 'bg-red-500';
    if (overallProgress > 85) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  const overallProgressColorClass = getOverallProgressColorClass();


  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-teal-600 dark:text-teal-400">
          ملخص الميزانية لشهر {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الميزانية</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(overall.totalBudget)}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatNumber(overall.totalSpent)}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المتبقي</p>
                <p className={`text-2xl font-bold ${overall.totalRemaining < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>{formatNumber(overall.totalRemaining)}</p>
            </div>
        </div>

        <div className="mt-6" aria-live="polite">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              نظرة عامة على المصروفات
            </span>
            <span className={`text-sm font-bold ${isOverallOverBudget ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {formatNumber(Math.round(overallProgress))}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Overall spending progress">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${overallProgressColorClass}`}
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outflowCategories.map(category => (
          <BudgetCard
            key={category}
            category={category}
            budget={budgets[category] || 0}
            spent={spendingByCategory[category] || 0}
            onBudgetChange={onBudgetChange}
            onRemoveCategory={onRemoveCategory}
            onEditCategory={onEditCategory}
          />
        ))}
        <AddCategoryCard onAdd={onAddCategory} />
      </div>
    </div>
  );
};