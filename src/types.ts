export type Category = 'Makanan' | 'Transportasi' | 'Belanja' | 'Hiburan' | 'Tagihan' | 'Lainnya' | 'Gaji' | 'Bonus' | 'Investasi';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  recurringLastCreated?: string; // ISO date
  createdAt?: any;
}

export interface Debt {
  id: string;
  userId: string;
  person: string;
  amount: number;
  type: 'debt' | 'receivable';
  dueDate: string;
  description: string;
  isPaid: boolean;
  createdAt: any;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  createdAt: any;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface UserSettings {
  userName?: string;
  monthlyBudget: number;
  currency: 'IDR' | 'USD' | 'SGD';
  privacyMode: boolean;
  darkMode: boolean;
  categoryBudgets: CategoryBudget[];
}
