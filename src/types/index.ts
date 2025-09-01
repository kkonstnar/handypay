// Common Transaction type used across the app
export interface Transaction {
  id: string;
  type:
    | "payment"
    | "received"
    | "withdrawal"
    | "card_payment"
    | "refund"
    | "qr_payment";
  amount: number;
  description: string;
  merchant?: string;
  date: Date;
  status: "completed" | "pending" | "failed" | "cancelled";
  cardLast4?: string;
  qrCode?: string;
  expiresAt?: Date;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Payout related types
export interface Payout {
  id: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  date: string;
  bankAccount: string;
  fee?: number;
  description?: string;
  payoutDate?: string;
  createdAt?: string;
  stripeSchedule?: string;
}

export interface PayoutHistoryItem {
  id: string;
  accountEnding: string;
  date: string;
  amount: number;
  type: "bank" | "card";
}

// Balance type
export interface Balance {
  balance: number;
  currency: string;
}

// Navigation types
export type RootStackParamList = {
  OnboardingScreen: undefined;
  HomeTabs: undefined;
  TransactionDetailsScreen: { transaction: Transaction };
  ScanToPayScreen: undefined;
  PaymentApproved: undefined;
  PaymentError: { amount?: number; currency?: string };
  ShareReceipt: undefined;
};
