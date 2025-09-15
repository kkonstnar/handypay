import { useRef, useCallback } from "react";
import { PAYMENT_CONSTANTS } from "../utils/paymentUtils";

export type PaymentStatus = "pending" | "completed" | "failed";

interface UsePaymentPollingProps {
  paymentLinkId: string | null;
  paymentUrl: string | null;
  onStatusChange: (status: PaymentStatus) => void;
  onPaymentCompleted: () => void;
  onPaymentFailed: () => void;
}

export const usePaymentPolling = ({
  paymentLinkId,
  paymentUrl,
  onStatusChange,
  onPaymentCompleted,
  onPaymentFailed,
}: UsePaymentPollingProps) => {
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const activeIntervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const sessionId = useRef<string>(
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  // Check payment status function
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentUrl || !paymentLinkId) {
      console.log("❌ No payment URL or ID available for status check");
      console.log("📊 Current state - URL:", paymentUrl, "ID:", paymentLinkId);
      return;
    }

    try {
      console.log(
        `🔍 [${sessionId.current}] Checking status for payment link ID:`,
        paymentLinkId
      );

      // Add timeout like PaymentLinkModal
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        PAYMENT_CONSTANTS.STATUS_CHECK_TIMEOUT
      );

      // Check payment link status via backend
      const response = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/payment-link-status/${paymentLinkId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Payment status response:", data);

        if (data.status === "completed" || data.status === "paid") {
          console.log("✅ Payment completed! Navigating to success screen");
          onStatusChange("completed");
          stopStatusPolling();
          onPaymentCompleted();
        } else if (data.status === "failed" || data.status === "expired") {
          console.log("❌ Payment failed! Navigating to error screen");
          onStatusChange("failed");
          stopStatusPolling();
          onPaymentFailed();
        } else {
          console.log("⏳ Payment still pending, status:", data.status);
        }
      } else {
        // Handle errors gracefully like ActivityScreen
        const isTimeoutError = response.status === 408;
        const isServerError = response.status >= 500;

        if (isTimeoutError) {
          console.log("⏰ Status check timeout, continuing to poll...");
        } else if (isServerError) {
          console.log("🛠️ Server error, will retry on next poll");
        } else {
          console.log("❌ Status check API call failed:", response.status);
        }
      }
    } catch (error: any) {
      console.error("❌ Status check failed:", error);

      if (error.name === "AbortError") {
        console.log("⏰ Status check timed out, will retry on next poll");
      } else if (
        error.message?.includes("timeout") ||
        error.message?.includes("408")
      ) {
        console.log("⚠️ Network timeout detected, continuing status polling");
      } else {
        console.log("❌ Unexpected error in status check:", error.message);
      }
    }
  }, [
    paymentUrl,
    paymentLinkId,
    onStatusChange,
    onPaymentCompleted,
    onPaymentFailed,
  ]);

  // Start polling for payment status
  const startStatusPolling = useCallback(() => {
    // Clean up any existing polling first
    stopStatusPolling();

    console.log(
      `🔄 [${sessionId.current}] Starting payment status polling with ID:`,
      paymentLinkId
    );

    // Use a more reasonable polling interval
    const interval = setInterval(
      checkPaymentStatus,
      PAYMENT_CONSTANTS.STATUS_POLLING_INTERVAL
    );
    statusCheckInterval.current = interval;
    activeIntervals.current.add(interval);
  }, [checkPaymentStatus, paymentLinkId]);

  // Stop polling
  const stopStatusPolling = useCallback(() => {
    console.log(`🛑 [${sessionId.current}] Stopping payment status polling`);
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      activeIntervals.current.delete(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("🧹 Cleaning up payment polling intervals");
    activeIntervals.current.forEach((interval) => {
      clearInterval(interval);
    });
    activeIntervals.current.clear();

    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  }, []);

  return {
    startStatusPolling,
    stopStatusPolling,
    cleanup,
    sessionId: sessionId.current,
  };
};
