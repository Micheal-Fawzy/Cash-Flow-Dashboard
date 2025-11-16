import React, { useState, useMemo, useEffect } from 'react';
import { utils, writeFile, read } from 'xlsx';
import { DailyView } from './components/DailyView.tsx';
import { MonthlyView } from './components/MonthlyView.tsx';
import { AllTransactionsView } from './components/AllTransactionsView.tsx';
import { Header } from './components/Header.tsx';
import { Transaction, Budgets } from './types.ts';
import { generateInitialData, CASH_INFLOW_CATEGORIES, DEFAULT_CASH_OUTFLOW_CATEGORIES, MONTHS } from './constants.ts';
import { BudgetView } from './components/BudgetView.tsx';

export type View = 'daily' | 'monthly' | 'all' | 'budget';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to the current month and year
  
  const [outflowCategories, setOutflowCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cashflow-outflow-categories');
      return saved ? JSON.parse(saved) : DEFAULT_CASH_OUTFLOW_CATEGORIES;
    } catch (error) {
      console.error("Error reading outflow categories from localStorage:", error);
      return DEFAULT_CASH_OUTFLOW_CATEGORIES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem('cashflow-transactions');
      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error reading transactions from localStorage:", error);
    }
    return generateInitialData();
  });

   const [budgets, setBudgets] = useState<Budgets>(() => {
    try {
      const savedBudgets = localStorage.getItem('cashflow-budgets');
      if (savedBudgets) {
        return JSON.parse(savedBudgets);
      }
    } catch (error) {
      console.error("Error reading budgets from localStorage:", error);
    }
    // Initialize with all outflow categories set to 0
    const initialBudgets: Budgets = {};
    outflowCategories.forEach(cat => {
      initialBudgets[cat] = 0;
    });
    return initialBudgets;
  });

  const [logo, setLogo] = useState<string | null>(() => {
    try {
        const savedLogo = localStorage.getItem('cashflow-logo');
        return savedLogo || null;
    } catch (error) {
        console.error("Error reading logo from localStorage:", error);
        return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cashflow-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving transactions to localStorage:", error);
    }
  }, [transactions]);
  
  useEffect(() => {
    try {
      localStorage.setItem('cashflow-outflow-categories', JSON.stringify(outflowCategories));
       // Prune budgets that are no longer in categories
        setBudgets(prev => {
            const newBudgets: Budgets = {};
            outflowCategories.forEach(cat => {
                newBudgets[cat] = prev[cat] || 0;
            });
            return newBudgets;
        });
    } catch (error) {
      console.error("Error saving outflow categories to localStorage:", error);
    }
  }, [outflowCategories]);

  useEffect(() => {
    try {
      localStorage.setItem('cashflow-budgets', JSON.stringify(budgets));
    } catch (error)      {
      console.error("Error saving budgets to localStorage:", error);
    }
  }, [budgets]);

  useEffect(() => {
    try {
        if (logo) {
            localStorage.setItem('cashflow-logo', logo);
        } else {
            localStorage.removeItem('cashflow-logo');
        }
    } catch (error) {
        console.error("Error saving logo to localStorage:", error);
    }
  }, [logo]);


  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const handleTransactionChange = (date: string, category: string, amount: number) => {
    setTransactions(prevTransactions => {
      const existingTransactionIndex = prevTransactions.findIndex(
        t => t.date === date && t.category === category
      );

      if (existingTransactionIndex > -1) {
        if (amount === 0) {
          // Remove transaction if amount is set to 0
          return prevTransactions.filter((_, index) => index !== existingTransactionIndex);
        } else {
          // Update existing transaction
          const updatedTransactions = [...prevTransactions];
          updatedTransactions[existingTransactionIndex] = { ...updatedTransactions[existingTransactionIndex], amount };
          return updatedTransactions;
        }
      } else if (amount !== 0) {
        // Add new transaction
        const newTransaction: Transaction = {
          id: `${date}-${category}`,
          date,
          category,
          amount,
        };
        return [...prevTransactions, newTransaction];
      }
      return prevTransactions;
    });
  };
  
  const handleDescriptionChange = (transactionId: string, description: string) => {
    setTransactions(prevTransactions => {
        const transactionIndex = prevTransactions.findIndex(t => t.id === transactionId);
        if (transactionIndex > -1) {
            const updatedTransactions = [...prevTransactions];
            const updatedTransaction = { ...updatedTransactions[transactionIndex], description };

            if (description === '') {
                delete updatedTransaction.description;
            }

            updatedTransactions[transactionIndex] = updatedTransaction;
            return updatedTransactions;
        }
        return prevTransactions;
    });
  };

  const handleAddNewTransaction = (newTransactionData: Omit<Transaction, 'id'>) => {
    setTransactions(prev => {
        const newTransaction: Transaction = {
            ...newTransactionData,
            id: crypto.randomUUID(),
        };
        return [...prev, newTransaction];
    });
  };
  
  const handleDeleteTransaction = (transactionId: string) => {
      if (window.confirm('هل أنت متأكد أنك تريد حذف هذه المعاملة؟')) {
          setTransactions(prev => prev.filter(t => t.id !== transactionId));
      }
  };

   const handleBudgetChange = (category: string, amount: number) => {
    setBudgets(prevBudgets => ({
      ...prevBudgets,
      [category]: amount >= 0 ? amount : 0, // Ensure budget isn't negative
    }));
  };
  
  const handleAddOutflowCategory = (name: string) => {
      if (!name || outflowCategories.includes(name) || CASH_INFLOW_CATEGORIES.includes(name)) {
          alert("اسم البند غير صالح أو موجود بالفعل.");
          return;
      }
      setOutflowCategories(prev => [...prev, name]);
      setBudgets(prev => ({...prev, [name]: 0}));
  };

  const handleRemoveOutflowCategory = (name: string) => {
      const isUsed = transactions.some(t => t.category === name);
      if (isUsed) {
          alert("لا يمكن حذف هذا البند لأنه مرتبط بمعاملات حالية. يرجى حذف المعاملات أولاً.");
          return;
      }
      if (window.confirm(`هل أنت متأكد أنك تريد حذف بند "${name}"؟`)) {
          setOutflowCategories(prev => prev.filter(cat => cat !== name));
          // Budget pruning is handled by useEffect on outflowCategories
      }
  };
  
  const handleEditOutflowCategory = (oldName: string, newName: string) => {
      if (!newName || (newName !== oldName && (outflowCategories.includes(newName) || CASH_INFLOW_CATEGORIES.includes(newName)))) {
          alert("اسم البند الجديد غير صالح أو موجود بالفعل.");
          return;
      }
      // Update category name
      setOutflowCategories(prev => prev.map(cat => cat === oldName ? newName : cat));
      
      // Update budget key
      setBudgets(prev => {
          const newBudgets = {...prev};
          if(oldName in newBudgets) {
              newBudgets[newName] = newBudgets[oldName];
              delete newBudgets[oldName];
          }
          return newBudgets;
      });

      // Update transactions
      setTransactions(prev => prev.map(t => {
          if (t.category === oldName) {
              return {...t, category: newName};
          }
          return t;
      }));
  };

  const filteredTransactions = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    return transactions.filter(t => t.date.startsWith(monthString));
  }, [transactions, selectedDate]);
  
  const handleImportFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'array', cellDates: true });
        
        let importedTransactions: Transaction[] = [];
        const newCategories = new Set<string>();

        const processSheet = (sheetName: string, isOutflow: boolean) => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            const jsonData = utils.sheet_to_json<any>(worksheet);

            jsonData.forEach(row => {
              const date = row['التاريخ'];
              const category = row['البند'];
              const amount = row['المبلغ'];
              const description = row['الوصف'];

              if (date && category && typeof amount === 'number') {
                let dateString: string;
                if (date instanceof Date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    dateString = `${year}-${month}-${day}`;
                } else if (typeof date === 'string') {
                    const parsedDate = new Date(date);
                    if(!isNaN(parsedDate.getTime())){
                         const year = parsedDate.getFullYear();
                         const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                         const day = String(parsedDate.getDate()).padStart(2, '0');
                         dateString = `${year}-${month}-${day}`;
                    } else {
                         console.warn(`Invalid date string found: ${date}`);
                         return;
                    }
                } else {
                    console.warn(`Invalid date format for row:`, row);
                    return;
                }
                
                const newTransaction: Transaction = {
                  id: `${dateString}-${category}`,
                  date: dateString,
                  category,
                  amount,
                };
                
                if (isOutflow && !outflowCategories.includes(category) && !CASH_INFLOW_CATEGORIES.includes(category)) {
                    newCategories.add(category);
                }

                if (description && typeof description === 'string' && description.trim() !== '') {
                    newTransaction.description = description.trim();
                }

                importedTransactions.push(newTransaction);
              } else {
                  console.warn('Skipping invalid row during import:', row);
              }
            });
        };
        
        processSheet("التدفقات الداخلة", false);
        processSheet("التدفقات الخارجة", true);

        if (importedTransactions.length === 0 && workbook.SheetNames.length > 0) {
            // A generic import for single-sheet files
            const firstSheetData = utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
             firstSheetData.forEach(row => {
                 // Simplified logic as we can't determine inflow/outflow
                 const category = row['البند'];
                 if(category && !CASH_INFLOW_CATEGORIES.includes(category) && !outflowCategories.includes(category)) {
                     newCategories.add(category);
                 }
             });
            processSheet(workbook.SheetNames[0], true); // Assume outflow for new categories
        }
        
        if (newCategories.size > 0) {
            setOutflowCategories(prev => [...prev, ...Array.from(newCategories)]);
        }

        if (importedTransactions.length > 0) {
            setTransactions(prevTransactions => {
                const transactionsMap = new Map<string, Transaction>();
                prevTransactions.forEach(t => transactionsMap.set(t.id, t));
                importedTransactions.forEach(t => {
                    const existingTransaction = transactionsMap.get(t.id);
                    // Preserve existing description if imported one is not provided
                    if (existingTransaction && t.description === undefined) {
                        t.description = existingTransaction.description;
                    }
                    transactionsMap.set(t.id, t);
                });
                return Array.from(transactionsMap.values());
            });
            alert(`${importedTransactions.length} معاملة تم استيرادها بنجاح! ${newCategories.size > 0 ? `وتم إضافة ${newCategories.size} بند جديد.` : ''}`);
        } else {
            alert('لم يتم العثور على معاملات صالحة في الملف. يرجى التأكد من أن الأعمدة مسماة "التاريخ", "البند", "المبلغ" (و "الوصف" اختياريا).');
        }
      } catch (error) {
          console.error("Error processing Excel file:", error);
          alert('حدث خطأ أثناء معالجة الملف. يرجى التأكد من أنه ملف إكسل صالح.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportToExcel = () => {
    const workbook = utils.book_new();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // 1. Daily View Sheet for the selected month
    const generateDailySheet = () => {
        const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthlyTransactions = transactions.filter(t => t.date.startsWith(monthString));
        
        const transactionsMap = new Map<string, number>();
        monthlyTransactions.forEach(t => {
            transactionsMap.set(`${t.date}-${t.category}`, t.amount);
        });

        const daysInMonth = getDaysInMonth(year, month);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const headers = ['البند / اليوم', ...days, 'الفترة 1-10', 'الفترة 11-20', `الفترة 21-${daysInMonth}`];
        const data: (string | number)[][] = [headers];

        const getTransactionValue = (day: number, category: string) => {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return transactionsMap.get(`${date}-${category}`) || 0;
        };

        const calculatePeriodTotal = (categoryData: number[], start: number, end: number) => {
            return categoryData.slice(start, end).reduce((sum, value) => sum + value, 0);
        };

        const processCategories = (title: string, categories: string[]) => {
            data.push([title]);
            categories.forEach(category => {
                const dailyValues = days.map(day => getTransactionValue(day, category));
                const row = [
                    category, 
                    ...dailyValues,
                    calculatePeriodTotal(dailyValues, 0, 10),
                    calculatePeriodTotal(dailyValues, 10, 20),
                    calculatePeriodTotal(dailyValues, 20, daysInMonth),
                ];
                data.push(row);
            });
        };
        
        processCategories('التدفقات النقدية الداخلة', CASH_INFLOW_CATEGORIES);
        const dailyInflows = days.map(day => CASH_INFLOW_CATEGORIES.reduce((sum, category) => sum + getTransactionValue(day, category), 0));
        data.push(['إجمالي الإيصالات', ...dailyInflows, calculatePeriodTotal(dailyInflows, 0, 10), calculatePeriodTotal(dailyInflows, 10, 20), calculatePeriodTotal(dailyInflows, 20, daysInMonth)]);

        processCategories('التدفقات النقدية الخارجة', outflowCategories);
        const dailyOutflows = days.map(day => outflowCategories.reduce((sum, category) => sum + getTransactionValue(day, category), 0));
        data.push(['إجمالي المدفوعات', ...dailyOutflows, calculatePeriodTotal(dailyOutflows, 10, 20), calculatePeriodTotal(dailyOutflows, 10, 20), calculatePeriodTotal(dailyOutflows, 20, daysInMonth)]);
        
        const dailyNetFlow = days.map((_, index) => dailyInflows[index] - dailyOutflows[index]);
        data.push(['صافي التدفق النقدي', ...dailyNetFlow, calculatePeriodTotal(dailyNetFlow, 0, 10), calculatePeriodTotal(dailyNetFlow, 10, 20), calculatePeriodTotal(dailyNetFlow, 20, daysInMonth)]);

        const cumulativeBalance = days.reduce<number[]>((acc, _, index) => {
            const prevBalance = index > 0 ? acc[index - 1] : 0;
            acc.push(prevBalance + dailyNetFlow[index]);
            return acc;
        }, []);
         data.push(['الرصيد الختامي / التراكمي', ...cumulativeBalance, cumulativeBalance[9] ?? 0, cumulativeBalance[19] ?? 0, cumulativeBalance[daysInMonth - 1] ?? 0]);

        const worksheet = utils.aoa_to_sheet(data);
        utils.book_append_sheet(workbook, worksheet, `العرض اليومي ${MONTHS[month]}`);
    };

    // 2. Monthly Summary Sheet for the selected year
    const generateMonthlySheet = () => {
        const monthlySummary = MONTHS.map(monthName => ({
            month: monthName, totalIncome: 0, totalExpenses: 0
        }));

        transactions.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate.getFullYear() === year) {
                const monthIndex = transactionDate.getMonth();
                if (CASH_INFLOW_CATEGORIES.includes(t.category)) {
                    monthlySummary[monthIndex].totalIncome += t.amount;
                } else {
                    monthlySummary[monthIndex].totalExpenses += t.amount;
                }
            }
        });

        const exportData = monthlySummary.map(d => ({
            'الشهر': d.month,
            'إجمالي الدخل': d.totalIncome,
            'إجمالي المصروفات': d.totalExpenses,
            'صافي التدفق النقدي': d.totalIncome - d.totalExpenses
        }));
        
        const totals = exportData.reduce((acc, month) => {
            acc['إجمالي الدخل'] += month['إجمالي الدخل'];
            acc['إجمالي المصروفات'] += month['إجمالي المصروفات'];
            acc['صافي التدفق النقدي'] += month['صافي التدفق النقدي'];
            return acc;
        }, { 'الشهر': 'الإجمالي', 'إجمالي الدخل': 0, 'إجمالي المصروفات': 0, 'صافي التدفق النقدي': 0 });
        
        exportData.push(totals);

        const worksheet = utils.json_to_sheet(exportData);
        utils.book_append_sheet(workbook, worksheet, `الملخص الشهري ${year}`);
    };
    
    // 3. All Transactions Sheets
    const generateAllTransactionsSheets = () => {
        const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const inflows = sorted.filter(t => CASH_INFLOW_CATEGORIES.includes(t.category))
                              .map(t => ({ 'التاريخ': t.date, 'البند': t.category, 'الوصف': t.description ?? '', 'المبلغ': t.amount }));
        
        const outflows = sorted.filter(t => outflowCategories.includes(t.category))
                               .map(t => ({ 'التاريخ': t.date, 'البند': t.category, 'الوصف': t.description ?? '', 'المبلغ': t.amount }));

        const inflowSheet = utils.json_to_sheet(inflows);
        const outflowSheet = utils.json_to_sheet(outflows);
        
        utils.book_append_sheet(workbook, inflowSheet, "التدفقات الداخلة");
        utils.book_append_sheet(workbook, outflowSheet, "التدفقات الخارجة");
    };

    // Generate all sheets and add them to the workbook
    generateDailySheet();
    generateMonthlySheet();
    generateAllTransactionsSheets();

    // Write and download the consolidated file
    writeFile(workbook, `CashFlow_Report_${year}-${String(month + 1).padStart(2, '0')}.xlsx`);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const renderView = () => {
    switch(currentView) {
      case 'daily':
        return (
          <DailyView
            selectedDate={selectedDate}
            transactions={filteredTransactions}
            onTransactionChange={handleTransactionChange}
            outflowCategories={outflowCategories}
          />
        );
      case 'monthly':
        return (
          <MonthlyView
            selectedYear={selectedDate.getFullYear()}
            transactions={transactions}
            onDateChange={handleDateChange}
            setCurrentView={setCurrentView}
          />
        );
      case 'all':
        return <AllTransactionsView 
                    transactions={transactions} 
                    onDescriptionChange={handleDescriptionChange} 
                    onAddNewTransaction={handleAddNewTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    outflowCategories={outflowCategories}
                />;
      case 'budget':
        return <BudgetView 
                  budgets={budgets} 
                  onBudgetChange={handleBudgetChange} 
                  monthlyTransactions={filteredTransactions} 
                  selectedDate={selectedDate} 
                  outflowCategories={outflowCategories}
                  onAddCategory={handleAddOutflowCategory}
                  onRemoveCategory={handleRemoveOutflowCategory}
                  onEditCategory={handleEditOutflowCategory}
                />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" dir="rtl">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onImport={handleImportFromExcel}
        onExport={handleExportToExcel}
        logo={logo}
        onLogoChange={handleLogoChange}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;