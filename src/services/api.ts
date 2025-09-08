import { Transaction, Payout, Balance, ApiResponse } from "../types";

// API Base URL - points to our backend
const API_BASE_URL = "https://handypay-backend.handypay.workers.dev";

// Production-ready auth client with session management
export const authClient = {
  // Get current session
  getSession: async () => {
    try {
      console.log("🔍 Getting session from backend...");
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Session response status:", response.status);

      if (response.ok) {
        const sessionData = await response.json();
        console.log("✅ Session data received:", sessionData);
        return { data: sessionData };
      } else {
        console.log("❌ No active session found");
        return { data: null };
      }
    } catch (error) {
      console.error("❌ Session check failed:", error);
      return { data: null };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      console.log("🔐 Signing out...");
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("✅ Signed out successfully");
        return true;
      } else {
        console.warn("⚠️ Sign out response not OK:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Sign out failed:", error);
      return false;
    }
  },

  // Social sign-in methods
  signIn: {
    social: async ({ provider }: { provider: string }) => {
      console.log(`🔐 Initiating ${provider} sign-in...`);
      // This will be handled by the ExpoAuthService
      return { success: true };
    }
  },

  // Fetch with authentication
  $fetch: async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  }
};

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
        console.log(`🌐 Making authenticated API request to: ${endpoint}`, {
          method: options.method || "GET",
          hasBody: !!options.body,
          url: url,
        });

        // Use Better Auth client's fetch method which handles authentication automatically
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...options.headers,
        };

        const data = await authClient.$fetch(url, {
          method: options.method || "GET",
          headers,
          body: options.body,
          ...options,
        });

        console.log(`📡 API Response status: ${data.status}`, {
          ok: data.ok,
          statusText: data.statusText,
          url: data.url,
        });

        if (!data.ok) {
          const errorText = await data.text();
          console.error(`❌ API Error ${data.status}:`, errorText);

          // Check if it's an authentication error
          if (data.status === 401) {
            console.log(
              "🔐 Authentication error - user may need to log in again"
            );
          }

          return {
            data: null as T,
            success: false,
            error: `HTTP ${data.status}: ${errorText}`,
          };
        }

        const result = await data.json();

        // Only log success for important operations
        if (
          __DEV__ &&
          (endpoint.includes("balance") || endpoint.includes("onboarding"))
        ) {
          console.log(`✅ API Success:`, endpoint);
        }

        return {
          data: result.data || result,
          success: true,
          message: result.message || "Success",
        };
      } catch (fetchError: any) {
        console.error(`❌ API Error:`, fetchError.message || fetchError);

        // Handle authentication errors specifically
        if (
          fetchError.message?.includes("401") ||
          fetchError.message?.includes("Unauthorized")
        ) {
          console.log("🔐 Authentication error in fetch:", fetchError.message);
          return {
            data: null as T,
            success: false,
            error: "Unauthorized - Please log in again",
          };
        }

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
   * Get current user session from Better Auth
   */
  async getSession() {
    try {
      const session = await authClient.getSession();
      return session.data || null;
    } catch (error) {
      console.error("❌ Failed to get session:", error);
      return null;
    }
  }

  /**
   * Sign in with Google OAuth using Better Auth
   */
  async signInWithGoogle() {
    try {
      const data = await authClient.signIn.social({
        provider: "google",
      });
      return { success: true, data };
    } catch (error) {
      console.error("❌ Google sign in failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  }

  /**
   * Sign in with Apple OAuth using Better Auth
   */
  async signInWithApple() {
    try {
      const data = await authClient.signIn.social({
        provider: "apple",
      });
      return { success: true, data };
    } catch (error) {
      console.error("❌ Apple sign in failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  }

  /**
   * Sign out current user using Better Auth
   */
  async signOut() {
    try {
      const result = await authClient.signOut();
      return { success: result };
    } catch (error) {
      console.error("❌ Sign out failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      };
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
        data: { balance: 0, currency: "USD" },
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

    return {
      data: { balance: 0, currency: "USD" },
      success: false,
      error: "Failed to get balance",
    };
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
