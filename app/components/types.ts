// Transaction type definition
export type Transaction = {
  id: string;
  name: string;
  type: 'deposit' | 'withdrawal' | 'account_creation';
  amount: number;
  timestamp: string;
  time: string;
  date: string;
  createdAt: string;
  status?: string;
  reference: string;
}; 