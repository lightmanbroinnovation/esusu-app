import { Transaction } from './index';

// Helper function to create a date string in format MM/DD/YYYY
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

// Today's date
const today = new Date();
const todayString = formatDate(today);

// Yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayString = formatDate(yesterday);

// Generate a timestamp string (HH:MM AM/PM)
const formatTime = (): string => {
  return '12:03 AM'; // For demo, using fixed time
};

// Generate dummy transaction data
export const transactions: Transaction[] = [
  // Today's transactions
  {
    id: '1',
    name: 'Aisha Bello',
    type: 'deposit',
    amount: 5000,
    timestamp: formatTime(),
    date: todayString
  },
  {
    id: '2',
    name: 'Ade Martins',
    type: 'withdrawal',
    amount: 10000,
    timestamp: formatTime(),
    date: todayString
  },
  {
    id: '3',
    name: 'Chioma',
    type: 'account_creation',
    amount: 50,
    timestamp: formatTime(),
    date: todayString
  },
  
  // Yesterday's transactions
  {
    id: '4',
    name: 'Aisha Bello',
    type: 'deposit',
    amount: 5000,
    timestamp: formatTime(),
    date: yesterdayString
  },
  {
    id: '5',
    name: 'Ade Martins',
    type: 'withdrawal',
    amount: 10000,
    timestamp: formatTime(),
    date: yesterdayString
  },
  {
    id: '6',
    name: 'Chioma',
    type: 'account_creation',
    amount: 50,
    timestamp: formatTime(),
    date: yesterdayString
  }
];

// Export a function to get transactions filtered by date range
export const getTransactionsByDateRange = (startDate: Date, endDate: Date): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}; 