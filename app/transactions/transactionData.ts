import { Transaction } from '../components/types';

// Generate realistic timestamps
const generateCreatedAt = (daysAgo: number, hour: number, minute: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// Generate dummy transaction data with realistic timestamps
export const transactions: Transaction[] = [
  // Today's transactions
  {
    id: '1',
    name: 'Aisha Bello',
    type: 'deposit',
    amount: 5000,
    timestamp: '12:03 AM',
    time: '12:03 AM',
    date: new Date().toLocaleDateString('en-US'),
    createdAt: generateCreatedAt(0, 0, 3), // Today at 12:03 AM
    status: 'completed'
  },
  {
    id: '2',
    name: 'Ade Martins',
    type: 'withdrawal',
    amount: 10000,
    timestamp: '12:03 AM',
    time: '12:03 AM',
    date: new Date().toLocaleDateString('en-US'),
    createdAt: generateCreatedAt(0, 0, 3), // Today at 12:03 AM
    status: 'completed'
  },
  {
    id: '3',
    name: 'Chioma',
    type: 'account_creation',
    amount: 50,
    timestamp: '12:03 AM',
    time: '12:03 AM',
    date: new Date().toLocaleDateString('en-US'),
    createdAt: generateCreatedAt(0, 0, 3), // Today at 12:03 AM
    status: 'completed'
  },
  
  // Yesterday's transactions
  {
    id: '4',
    name: 'Aisha Bello',
    type: 'deposit',
    amount: 5000,
    timestamp: '12:03 AM',
    time: '12:03 AM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
    createdAt: generateCreatedAt(1, 0, 3), // Yesterday at 12:03 AM
    status: 'completed'
  },
  {
    id: '5',
    name: 'Ade Martins',
    type: 'withdrawal',
    amount: 10000,
    timestamp: '12:03 AM',
    time: '12:03 AM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
    createdAt: generateCreatedAt(1, 0, 3), // Yesterday at 12:03 AM
    status: 'completed'
  },
  {
    id: '6',
    name: 'Chioma',
    type: 'account_creation',
    amount: 50,
    timestamp: '12:03 AM',
    time: '12:03 AM',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
    createdAt: generateCreatedAt(1, 0, 3), // Yesterday at 12:03 AM
    status: 'completed'
  }
];

// Function to get transactions for a specific user (simulated)
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`Getting transactions for user: ${userId}`);
  console.log('Available transactions:');
  transactions.forEach(transaction => {
    console.log(`  - ${transaction.name}: ${transaction.type} of ${transaction.amount}`);
  });
  
  return transactions;
};

// Export a function to get transactions filtered by date range
export const getTransactionsByDateRange = (startDate: Date, endDate: Date): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}; 