
export interface Transaction {
  id: string;
  date: string; // Format: YYYY-MM-DD
  category: string;
  amount: number;
  description?: string;
}

export interface Budgets {
  [category: string]: number;
}
