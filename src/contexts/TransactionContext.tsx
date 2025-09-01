import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiService } from '../services/api';

export interface Transaction {
  id: string;
  originalId?: string; // Original database ID for cancellation
  type: 'payment' | 'received' | 'withdrawal' | 'card_payment' | 'refund' | 'qr_payment' | 'payment_link';
  amount: number;
  description: string;
  merchant?: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  cardLast4?: string;
  qrCode?: string;
  expiresAt?: Date;
  paymentMethod?: 'qr_code' | 'payment_link';
  stripePaymentLinkId?: string; // For Stripe payment link transactions
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  cancelTransaction: (id: string, userId: string) => Promise<void>;
  getTransaction: (id: string) => Transaction | undefined;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'date'>): Transaction => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date(),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id 
          ? { ...transaction, ...updates }
          : transaction
      )
    );
  };

  const cancelTransaction = async (id: string, userId: string) => {
    console.log('Cancelling transaction:', id, 'for user:', userId);

    try {
      // Call the API to cancel the transaction
      const result = await apiService.cancelTransaction(id, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel transaction');
      }

      console.log('Transaction cancelled successfully via API');

      // Update local transaction status - we need to find the correct transaction ID
      // since the backend might have found it using different lookup methods
      const transaction = getTransaction(id);
      if (transaction) {
        updateTransaction(transaction.id, { status: 'cancelled' });
      } else {
        // If we can't find it locally, try to find it by stripePaymentLinkId
        const allTransactions = transactions;
        const foundTx = allTransactions.find(tx =>
          tx.id === id ||
          tx.stripePaymentLinkId === id ||
          (id.startsWith('plink_') && tx.stripePaymentLinkId === id.replace('plink_', ''))
        );
        if (foundTx) {
          updateTransaction(foundTx.id, { status: 'cancelled' });
        }
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw error;
    }
  };

  const getTransaction = (id: string): Transaction | undefined => {
    return transactions.find(transaction => transaction.id === id);
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      updateTransaction,
      cancelTransaction,
      getTransaction
    }}>
      {children}
    </TransactionContext.Provider>
  );
}