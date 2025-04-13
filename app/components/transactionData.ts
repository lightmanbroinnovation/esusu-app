import { Transaction } from './types';
import { fetchTransactions } from '../../services/api'; // Adjust the path as necessary

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

// Function to fetch transactions for a user
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactions = await fetchTransactions(userId); // Fetch transactions using the API
    return transactions; // Return the fetched transactions
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return []; // Return an empty array in case of error
  }
};

// Function to group transactions by date
const groupTransactionsByDate = (transactions: Transaction[]): Record<string, Transaction[]> => {
  const groupedTransactions: Record<string, Transaction[]> = {};

  transactions.forEach(transaction => {
    const transactionDate = transaction.date;

    // If the date is not already a key in the groupedTransactions, create it
    if (!groupedTransactions[transactionDate]) {
      groupedTransactions[transactionDate] = [];
    }

    // Push the transaction into the corresponding date group
    groupedTransactions[transactionDate].push(transaction);
  });

  return groupedTransactions;
};

// Example usage of getUserTransactions
const exampleUserId = "62f2"; // Replace with the actual user ID you want to fetch
getUserTransactions(exampleUserId).then(transactions => {
  const groupedTransactions = groupTransactionsByDate(transactions);
  
  // Display the grouped transactions
  for (const date in groupedTransactions) {
    console.log(`Date: ${date}`);
    groupedTransactions[date].forEach(transaction => {
      console.log(`  - ${transaction.name}: ${transaction.type} of ${transaction.amount}`);
    });
  }
});

// Export a function to get transactions filtered by date range
export const getTransactionsByDateRange = (transactions: Transaction[], startDate: Date, endDate: Date): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}; 