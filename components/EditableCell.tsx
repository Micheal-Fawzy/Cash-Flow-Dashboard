
import React, { useState, useEffect } from 'react';

interface EditableCellProps {
  value: number;
  onSave: (value: number) => void;
}

const evaluateExpression = (expr: string): number | null => {
    // Only allow numbers, operators, and parentheses.
    const sanitizedExpr = String(expr).replace(/[^0-9+\-*/().]/g, '');
    if (sanitizedExpr.trim() === '') return 0;
    try {
        // Use the Function constructor for safer evaluation than eval().
        const result = new Function(`return ${sanitizedExpr}`)();
        if (typeof result === 'number' && isFinite(result)) {
            return result;
        }
        return null; // Handle cases where expression is valid but not a number (e.g., "()").
    } catch (e) {
        // If Function constructor fails, it's likely not a valid expression.
        // As a fallback, try to parse it as a plain number.
        const num = parseFloat(sanitizedExpr);
        return isNaN(num) ? null : num;
    }
};

export const EditableCell: React.FC<EditableCellProps> = ({ value, onSave }) => {
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
    const numericValue = evaluated !== null ? evaluated : 0;
    
    if (numericValue !== value) {
      onSave(numericValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentValue(String(value));
      setIsEditing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num === 0) return "-";
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="w-full h-full min-h-[40px] flex items-center justify-center" onClick={() => setIsEditing(true)}>
      {isEditing ? (
        <input
          type="text"
          value={currentValue === '0' ? '' : currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          autoFocus
          className="w-full h-full text-center bg-teal-100 dark:bg-teal-800 border-none outline-none focus:ring-2 focus:ring-teal-500 p-2"
        />
      ) : (
        <span className="cursor-pointer w-full h-full flex items-center justify-center p-2">
            {value !== 0 ? formatNumber(value) : <span className="text-gray-400">-</span>}
        </span>
      )}
    </div>
  );
};