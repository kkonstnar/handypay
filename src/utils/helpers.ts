import { Transaction } from '../types';

// Date formatting utilities
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const formatAmount = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Transaction utilities
export const getTransactionIcon = (type: Transaction['type']): string => {
  switch (type) {
    case 'card_payment': return 'card';
    case 'received': return 'arrow-down';
    case 'withdrawal': return 'cash';
    case 'refund': return 'return-up-back';
    default: return 'swap-horizontal';
  }
};

export const getTransactionColor = (type: Transaction['type']): string => {
  switch (type) {
    case 'received':
    case 'refund': return '#3AB75C';
    case 'card_payment':
    case 'withdrawal': return '#ef4444';
    default: return '#6b7280';
  }
};

// Group transactions by date
export const groupTransactionsByDate = (transactions: Transaction[]) => {
  const groups: { [key: string]: { transactions: Transaction[], date: Date } } = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  transactions.forEach(transaction => {
    const transactionDate = transaction.date;
    let key: string;
    
    if (transactionDate.toDateString() === today.toDateString()) {
      key = 'TODAY';
    } else if (transactionDate.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday, ' + transactionDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase();
    } else {
      key = transactionDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    if (!groups[key]) {
      groups[key] = { transactions: [], date: transactionDate };
    }
    groups[key].transactions.push(transaction);
  });
  
  // Sort groups by date (newest first) and transactions within groups by time (newest first)
  return Object.entries(groups)
    .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime())
    .map(([title, { transactions }]) => ({
      title,
      data: transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
    }));
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateAmount = (amount: string): boolean => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};