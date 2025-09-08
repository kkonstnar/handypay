import { Transaction, Payout, Balance, ApiResponse } from "../types";
import { createAuthClient } from "@better-auth/client";

// API Base URL - points to our backend
const API_BASE_URL = "https://handypay-backend.handypay.workers.dev";

// Better Auth client setup
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    onRequest: (context) => {
      console.log("🌐 Auth request:", context.url);
      return {
        ...context,
        headers: {
          ...context.headers,
        },
      };
    },
    onResponse: (context) => {
      console.log("✅ Auth response:", context.response.status);
      return context;
    },
  },
});

/**
 * API Service for handling all backend API calls
 */
export class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Generic API request handler
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;

      // Only log in development mode and for important requests
      if (
        __DEV__ &&
        (endpoint.includes("error") || endpoint.includes("balance"))
      ) {
        console.log(`🌐 API Request: ${options.method || "GET"} ${endpoint}`);
      }

      // Use Better Auth client for authenticated requests
      try {
        const data = await authClient.$fetch<T>(endpoint, {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          body: options.body,
          ...options,
        });

        // Only log success for important operations
        if (
          __DEV__ &&
          (endpoint.includes("balance") || endpoint.includes("onboarding"))
        ) {
          console.log(`✅ API Success:`, endpoint);
        }

        return {
          data: data as T,
          success: true,
          message: "Success",
        };
      } catch (fetchError: any) {
        console.error(`❌ API Error:`, fetchError.message || fetchError);
        return {
          data: null as T,
          success: false,
          error: fetchError.message || "Network error",
        };
      }
    } catch (error) {
      console.error(
        `❌ API Network Error:`,
        error instanceof Error ? error.message : "Network error"
      );
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  /**
   * Get user transactions from database
   */
  async getUserTransactions(
    userId: string
  ): Promise<ApiResponse<Transaction[]>> {
    if (!userId) {
      return {
        data: [],
        success: false,
        error: "User ID is required",
      };
    }

    return this.apiRequest<Transaction[]>(`/api/transactions/${userId}`);
  }

  /**
   * Get current user session
   */
  async getSession() {
    try {
      const session = await authClient.getSession();
      return session;
    } catch (error) {
      console.error("❌ Failed to get session:", error);
      return null;
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "handypay://auth/callback",
      });
      return result;
    } catch (error) {
      console.error("❌ Google sign in failed:", error);
      throw error;
    }
  }

  /**
   * Sign in with Apple OAuth
   */
  async signInWithApple() {
    try {
      const result = await authClient.signIn.social({
        provider: "apple",
        callbackURL: "handypay://auth/callback",
      });
      return result;
    } catch (error) {
      console.error("❌ Apple sign in failed:", error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await authClient.signOut();
      return { success: true };
    } catch (error) {
      console.error("❌ Sign out failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user transactions (legacy method for backward compatibility)
   */
  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    // Return empty array for now - this should be called with user context
    console.warn(
      "getTransactions() called without user context. Use getUserTransactions(userId) instead."
    );
    return {
      data: [],
      success: true,
    };
  }

  /**
   * Cancel a transaction
   */
  async cancelTransaction(
    transactionId: string,
    userId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.apiRequest<{ message: string }>("/api/transactions/cancel", {
      method: "POST",
      body: JSON.stringify({
        transactionId,
        userId,
      }),
    });
  }

  /**
   * Get user payouts from Stripe
   */
  async getPayouts(userId?: string): Promise<ApiResponse<Payout[]>> {
    if (!userId) {
      return {
        data: [],
        success: false,
        error: "User ID is required",
      };
    }

    return this.apiRequest<Payout[]>(`/api/stripe/payouts/${userId}`);
  }

  /**
   * Get user balance from Stripe
   */
  async getBalance(userId?: string): Promise<ApiResponse<Balance>> {
    if (!userId) {
      return {
        data: null,
        success: false,
        error: "User ID is required",
      };
    }

    const response = await this.apiRequest<{
      balance: number;
      currency: string;
      stripeBalance: any[];
    }>(`/api/stripe/balance/${userId}`);

    // Transform response to match Balance interface
    if (response.success && response.data) {
      return {
        data: {
          balance: response.data.balance,
          currency: response.data.currency,
        },
        success: true,
        message: response.message,
      };
    }

    return response as ApiResponse<Balance>;
  }

  /**
   * Get next payout information
   */
  async getNextPayout(userId?: string): Promise<
    ApiResponse<{
      date: string;
      amount: number;
      currency: string;
      bankAccountEnding: string;
      estimatedProcessingDays: number;
    } | null>
  > {
    if (!userId) {
      return {
        data: null,
        success: false,
        error: "User ID is required",
      };
    }

    return this.apiRequest<{
      date: string;
      amount: number;
      currency: string;
      bankAccountEnding: string;
      estimatedProcessingDays: number;
      stripeSchedule: string;
    } | null>(`/api/stripe/next-payout/${userId}`);
  }

  /**
   * Create a new payout (manual payout - payouts are usually automatic)
   */
  async createPayout(
    amount: number,
    bankAccountId: string
  ): Promise<ApiResponse<Payout>> {
    // For now, simulate payout creation - replace with real API call
    const mockPayout: Payout = {
      id: `payout_${Date.now()}`,
      amount,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      bankAccount: bankAccountId,
      fee: Math.round(amount * 0.01), // 1% fee
      description: "Bank transfer payout",
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: mockPayout,
          success: true,
          message: "Payout request submitted successfully",
        });
      }, 1000); // Simulate network delay
    });
  }

  /**
   * Search transactions
   */
  async searchTransactions(query: string): Promise<ApiResponse<Transaction[]>> {
    // For now, return filtered mock data - replace with real API call
    const allTransactions = await this.getTransactions();

    if (!allTransactions.success || !allTransactions.data) {
      return allTransactions;
    }

    const filteredTransactions = allTransactions.data.filter(
      (tx) =>
        tx.description.toLowerCase().includes(query.toLowerCase()) ||
        tx.merchant?.toLowerCase().includes(query.toLowerCase()) ||
        tx.id.toLowerCase().includes(query.toLowerCase())
    );

    return {
      data: filteredTransactions,
      success: true,
    };
  }

  /**
   * Submit a bug report
   */
  async reportBug(bugReport: string): Promise<ApiResponse<void>> {
    // For now, simulate bug report submission - replace with real API call
    console.log("Bug report submitted:", bugReport);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: undefined,
          success: true,
          message: "Bug report submitted successfully",
        });
      }, 500); // Simulate network delay
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
