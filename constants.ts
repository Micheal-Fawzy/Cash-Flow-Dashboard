import { Transaction } from './types.ts';

export const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const CASH_INFLOW_CATEGORIES: string[] = [
  'راتب',
  'بونص',
  'اخرى'
];

export const DEFAULT_CASH_OUTFLOW_CATEGORIES: string[] = [
  'طعام',
  'مصاريف البيت',
  'زيارات',
  'جمعيات',
  'عشور',
  'مصاريف ميشيل',
  'مصاريف مارينا',
  'خروجات',
  'ايجار',
  'اخرى'
];

// Function to generate some initial data for demonstration
export const generateInitialData = (): Transaction[] => {
  return [
    
  ];
};