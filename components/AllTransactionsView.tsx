import React, { useMemo, useState, useEffect } from 'react';
import type { Transaction } from '../types.ts';
import { CASH_INFLOW_CATEGORIES } from '../constants.ts';

interface EditableTextCellProps {
  value: string;
  onSave: (value: string) => void;
}

const EditableTextCell: React.FC<EditableTextCellProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentValue.trim() !== value.trim()) {
      onSave(currentValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[40px] flex items-center justify-start" onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full h-full text-right bg-teal-100 dark:bg-teal-800 border-none outline-none focus:ring-2 focus:ring-teal-500 p-2"
        />
      ) : (
        <span className="cursor-pointer w-full h-full flex items-center justify-start p-2 truncate" title={value}>
            {value ? value : <span className="text-gray-400">إضافة وصف...</span>}
        </span>
      )}
    </div>
  );
};

interface AllTransactionsViewProps {
  transactions: Transaction[];
  onDescriptionChange: (transactionId: string, description: string) => void;
  onAddNewTransaction: (newTransactionData: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (transactionId: string) => void;
  outflowCategories: string[];
}

const evaluateExpression = (expr: string): number | null => {
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

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-EG').format(num);
};

const AddTransactionRow: React.FC<{
    categories: string[];
    onAdd: (newTransactionData: Omit<Transaction, 'id'>) => void;
}> = ({ categories, onAdd }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(categories[0] || '');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    
    useEffect(() => {
        // Reset category selection if the list changes and the current selection is no longer valid
        if (!categories.includes(category)) {
            setCategory(categories[0] || '');
        }
    }, [categories, category]);

    const handleAddClick = () => {
        const evaluatedAmount = evaluateExpression(amount);
        const numericAmount = evaluatedAmount !== null && evaluatedAmount > 0 ? evaluatedAmount : 0;

        if (!date || !category || numericAmount <= 0) {
            alert('يرجى إدخال التاريخ، البند، ومبلغ صحيح.');
            return;
        }

        onAdd({
            date,
            category,
            amount: numericAmount,
            description: description.trim() || undefined,
        });

        setDescription('');
        setAmount('');
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddClick();
        }
    }

    return (
        <tr className="bg-gray-100 dark:bg-gray-700/50">
            <td className="px-2 py-2">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-600 focus:ring-teal-500 focus:border-teal-500" />
            </td>
            <td className="px-2 py-2">
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-600 focus:ring-teal-500 focus:border-teal-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </td>
            <td className="px-2 py-2">
                <input type="text" placeholder="الوصف (اختياري)" value={description} onChange={e => setDescription(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-600 focus:ring-teal-500 focus:border-teal-500" />
            </td>
            <td className="px-2 py-2">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="المبلغ" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-600 focus:ring-teal-500 focus:border-teal-500" />
              </div>
            </td>
             <td className="px-2 py-2 text-center">
                 <button onClick={handleAddClick} className="p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex-shrink-0" aria-label="إضافة معاملة">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
            </td>
        </tr>
    );
};

const TrashIcon: React.FC<{className?: string}> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


interface TransactionTableProps {
    title: string;
    transactions: Transaction[];
    colorClass: string;
    categories: string[];
    onDescriptionChange: (transactionId: string, description: string) => void;
    onAddNewTransaction: (newTransactionData: Omit<Transaction, 'id'>) => void;
    onDeleteTransaction: (transactionId: string) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ title, transactions, colorClass, categories, onDescriptionChange, onAddNewTransaction, onDeleteTransaction }) => {
    const total = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className={`text-xl font-bold mb-4 ${colorClass}`}>{title}</h2>
            <div className="overflow-y-auto max-h-[65vh] relative">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3">التاريخ</th>
                            <th className="px-4 py-3">البند</th>
                            <th className="px-4 py-3">الوصف</th>
                            <th className="px-4 py-3">المبلغ</th>
                            <th className="px-4 py-3">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AddTransactionRow categories={categories} onAdd={onAddNewTransaction} />
                        {transactions.length > 0 ? (
                            transactions.map(t => (
                                <tr key={t.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-4 py-3 font-medium whitespace-nowrap">{t.date}</td>
                                    <td className="px-4 py-3">{t.category}</td>
                                    <td className="px-1 py-1 w-1/3">
                                        <EditableTextCell
                                            value={t.description ?? ''}
                                            onSave={(newDescription) => onDescriptionChange(t.id, newDescription)}
                                        />
                                    </td>
                                    <td className={`px-4 py-3 font-semibold ${colorClass}`}>{formatNumber(t.amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => onDeleteTransaction(t.id)} 
                                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
                                            aria-label={`حذف معاملة ${t.category}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    لا توجد معاملات مطابقة للبحث.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {transactions.length > 0 && (
                        <tfoot className="font-bold bg-gray-100 dark:bg-gray-700 sticky bottom-0">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-left">الإجمالي</td>
                                <td className={`px-4 py-3 ${colorClass}`}>{formatNumber(total)}</td>
                                <td className="px-4 py-3"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export const AllTransactionsView: React.FC<AllTransactionsViewProps> = ({ transactions, onDescriptionChange, onAddNewTransaction, onDeleteTransaction, outflowCategories }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);
    
    const filteredTransactions = useMemo(() => {
        if (!searchQuery) {
            return sortedTransactions;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return sortedTransactions.filter(t => {
            const categoryMatch = t.category.toLowerCase().includes(lowercasedQuery);
            const descriptionMatch = t.description?.toLowerCase().includes(lowercasedQuery) ?? false;
            const amountMatch = t.amount.toString().includes(lowercasedQuery);
            return categoryMatch || descriptionMatch || amountMatch;
        });
    }, [sortedTransactions, searchQuery]);

    const inflows = useMemo(() => {
        return filteredTransactions.filter(t => CASH_INFLOW_CATEGORIES.includes(t.category));
    }, [filteredTransactions]);

    const outflows = useMemo(() => {
        return filteredTransactions.filter(t => outflowCategories.includes(t.category));
    }, [filteredTransactions]);

    return (
        <div className="w-full">
            <div className="mb-6 relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="ابحث حسب البند, الوصف, أو المبلغ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-teal-500 dark:focus:border-teal-500"
                    aria-label="Search transactions"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TransactionTable 
                  title="كافة التدفقات النقدية الداخلة" 
                  transactions={inflows} 
                  colorClass="text-green-600 dark:text-green-400" 
                  categories={CASH_INFLOW_CATEGORIES}
                  onDescriptionChange={onDescriptionChange}
                  onAddNewTransaction={onAddNewTransaction} 
                  onDeleteTransaction={onDeleteTransaction}
                />
                <TransactionTable 
                  title="كافة التدفقات النقدية الخارجة" 
                  transactions={outflows} 
                  colorClass="text-red-600 dark:text-red-400" 
                  categories={outflowCategories}
                  onDescriptionChange={onDescriptionChange}
                  onAddNewTransaction={onAddNewTransaction}
                  onDeleteTransaction={onDeleteTransaction}
                />
            </div>
        </div>
    );
};