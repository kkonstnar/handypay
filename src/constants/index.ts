// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://handypay-backend.handypay.workers.dev",
  TIMEOUT: 10000, // 10 seconds
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: "HandyPay",
  VERSION: "3.3456.10000",
  SUPPORT_EMAIL: "support@tryhandypay.com",
  SUPPORT_PHONE: "1-800-HANDYPAY",
} as const;

// Colors (consider moving to a theme file)
export const COLORS = {
  PRIMARY: "#3AB75C",
  SECONDARY: "#007AFF",
  ERROR: "#ef4444",
  SUCCESS: "#3AB75C",
  WARNING: "#d97706",
  TEXT_PRIMARY: "#111827",
  TEXT_SECONDARY: "#6b7280",
  TEXT_MUTED: "#9ca3af",
  BACKGROUND: "#ffffff",
  SURFACE: "#f9fafb",
  BORDER: "#e5e7eb",
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  PAYMENT: "payment",
  RECEIVED: "received",
  WITHDRAWAL: "withdrawal",
  CARD_PAYMENT: "card_payment",
  REFUND: "refund",
} as const;

// Transaction Status
export const TRANSACTION_STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  FAILED: "failed",
} as const;

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  GENERIC_ERROR: "An error occurred. Please try again.",
  AUTHENTICATION_ERROR: "Authentication failed. Please log in again.",
  VALIDATION_ERROR: "Please check your input and try again.",
} as const;
