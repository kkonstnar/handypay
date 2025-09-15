import { ApiResponse } from "../types";

export interface PaymentLinkRequest {
  handyproUserId: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  amount: number; // Amount in cents
  taskDetails?: string;
  dueDate?: string;
  currency?: string; // Currency code (USD, JMD, etc.)
  paymentSource?: "qr_generation" | "payment_link_modal"; // Track the source
}

export interface PaymentLinkResponse {
  id: string;
  hosted_invoice_url: string;
  invoice_pdf?: string;
  status: string;
  amount_due: number;
  payment_link: string; // The actual payment link URL
}

export class StripePaymentService {
  private static readonly BASE_URL =
    "https://handypay-backend.handypay.workers.dev/api/stripe";

  /**
   * Create a simple Stripe payment link that works reliably
   */
  static async createPaymentLink(
    request: PaymentLinkRequest
  ): Promise<PaymentLinkResponse> {
    try {
      console.log(
        "🚀 Creating Stripe payment link for user:",
        request.handyproUserId
      );

      // Simplified approach - create a basic payment link that works
      const response = await fetch(`${this.BASE_URL}/create-payment-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handyproUserId: request.handyproUserId,
          customerName: request.customerName || "Customer",
          customerEmail: request.customerEmail,
          description:
            request.description ||
            `Payment for $${(request.amount / 100).toFixed(2)}`,
          amount: request.amount, // Amount in cents
          taskDetails: request.taskDetails,
          dueDate: request.dueDate,
          currency: request.currency || "USD", // Use passed currency or default to USD
          paymentSource: request.paymentSource || "payment_link_modal", // Pass payment source
          // Remove destination charges complexity for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Backend error:", errorData);
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Stripe payment link created:", data);

      // Handle both invoice and payment link responses
      const paymentLink = data.invoice?.hosted_invoice_url || data.payment_link;
      const invoiceId = data.invoice?.id || data.id;

      if (!paymentLink) {
        throw new Error("No payment link URL received from backend");
      }

      return {
        id: invoiceId,
        hosted_invoice_url: paymentLink,
        invoice_pdf: data.invoice?.invoice_pdf,
        status: data.invoice?.status || data.status || "open",
        amount_due: data.invoice?.amount_due || data.amount,
        payment_link: paymentLink,
      };
    } catch (error) {
      console.error("❌ Error creating Stripe payment link:", error);
      throw error;
    }
  }

  /**
   * Get user account status to verify they can create payment links
   */
  static async getAccountStatus(userId: string): Promise<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  }> {
    try {
      console.log(
        "🔍 StripePaymentService.getAccountStatus called with userId:",
        userId
      );
      console.log("🔍 API URL:", `${this.BASE_URL}/user-account/${userId}`);

      const response = await fetch(`${this.BASE_URL}/user-account/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to get account status: ${response.status}`);
      }

      const userData = await response.json();
      console.log("📊 StripePaymentService - API Response:", userData);

      // Handle both snake_case (backend) and camelCase (legacy) field names
      const stripeAccountId =
        userData.stripe_account_id || userData.stripeAccountId;
      console.log("📋 Extracted stripeAccountId:", stripeAccountId);

      if (!stripeAccountId) {
        throw new Error("No Stripe account found for user");
      }

      // Get the account status
      const statusResponse = await fetch(`${this.BASE_URL}/account-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeAccountId }),
      });

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to get account status: ${statusResponse.status}`
        );
      }

      const statusData = await statusResponse.json();

      if (!statusData.success) {
        throw new Error(statusData.error || "Failed to get account status");
      }

      return {
        charges_enabled: statusData.accountStatus?.charges_enabled || false,
        payouts_enabled: statusData.accountStatus?.payouts_enabled || false,
        details_submitted: statusData.accountStatus?.details_submitted || false,
      };
    } catch (error) {
      console.error("❌ Error getting account status:", error);
      throw error;
    }
  }

  /**
   * Generate a simple payment link URL for sharing (fallback method)
   */
  static generateSimplePaymentLink(
    amount: number,
    currency: string = "USD",
    userId?: string
  ): string {
    const baseUrl = "https://handypay.com/pay";
    const params = new URLSearchParams({
      amount: amount.toFixed(2),
      currency,
      timestamp: Date.now().toString(),
      ...(userId && { userId }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Convert amount from dollars to cents for Stripe
   */
  static dollarsToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from cents to dollars for display
   */
  static centsToDollars(amount: number): number {
    return amount / 100;
  }

  /**
   * Get payment status from Stripe
   */
  static async getPaymentStatus(paymentIntentId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: any;
  }> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/payment-status/${paymentIntentId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching payment status:", error);
      throw error;
    }
  }

  /**
   * Refresh transaction status from Stripe webhooks
   */
  static async refreshTransactionStatus(
    transactionId: string,
    userId: string
  ): Promise<void> {
    try {
      console.log(`🔄 Refreshing status for transaction ${transactionId}`);

      const response = await fetch(`${this.BASE_URL}/refresh-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to refresh transaction status"
        );
      }

      console.log(`✅ Transaction ${transactionId} status refreshed`);
    } catch (error) {
      console.error("Error refreshing transaction status:", error);
      throw error;
    }
  }

  /**
   * Cancel payment link
   */
  static async cancelPaymentLink(
    paymentLinkId: string,
    userId: string
  ): Promise<{
    id: string;
    active: boolean;
    url: string;
    cancelled_at: Date;
  }> {
    try {
      console.log(
        `🗑️ Cancelling payment link ${paymentLinkId} for user ${userId}`
      );

      const response = await fetch(`${this.BASE_URL}/cancel-payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentLinkId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel payment link");
      }

      const data = await response.json();
      return data.paymentLink;
    } catch (error) {
      console.error("Error cancelling payment link:", error);
      throw error;
    }
  }
}
