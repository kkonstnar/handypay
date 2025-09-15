import { useState, useCallback } from "react";
import { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { StripePaymentService } from "../services/StripePaymentService";
import {
  validateMinimumAmount,
  getErrorMessage,
  createTimeoutPromise,
  PAYMENT_CONSTANTS,
} from "../utils/paymentUtils";

interface QRGenerationState {
  paymentUrl: string | null;
  paymentLinkId: string | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
}

interface UseQRGenerationProps {
  amount: number;
  currency: string;
  initialPaymentLink?: string;
  userId?: string;
  userFullName?: string;
  userEmail?: string;
}

export const useQRGeneration = ({
  amount,
  currency,
  initialPaymentLink,
  userId,
  userFullName,
  userEmail,
}: UseQRGenerationProps) => {
  const [state, setState] = useState<QRGenerationState>({
    paymentUrl: null,
    paymentLinkId: null,
    loading: true,
    error: null,
    isRefreshing: false,
  });

  // Animation value for QR code pop effect
  const qrScaleAnimation = useSharedValue(0);

  const triggerQRAnimation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    qrScaleAnimation.value = 0;
    qrScaleAnimation.value = withTiming(1, {
      duration: PAYMENT_CONSTANTS.QR_ANIMATION_DURATION,
      easing: Easing.out(Easing.back(1.7)),
    });
  }, [qrScaleAnimation]);

  const generateQRCode = useCallback(async () => {
    try {
      console.log("🎯 Starting QR generation");

      let paymentUrl = initialPaymentLink;
      let linkId: string | null = null;

      // If no payment link provided, create one
      if (!paymentUrl && userId) {
        console.log("💳 Creating Stripe payment link");

        // Check if user has a valid Stripe account first
        const accountStatus = await StripePaymentService.getAccountStatus(
          userId
        );

        if (!accountStatus.charges_enabled) {
          console.error("❌ Stripe account not ready for payments");
          setState((prev) => ({
            ...prev,
            error:
              "Your Stripe account is not ready to accept payments. Please complete your onboarding first.",
            loading: false,
          }));
          return;
        }

        // Validate minimum amount for Stripe
        const validation = await validateMinimumAmount(amount, currency);
        if (!validation.isValid) {
          console.error("❌ Amount too low:", validation.errorMessage);
          setState((prev) => ({
            ...prev,
            error: validation.errorMessage,
            loading: false,
          }));
          return;
        }

        // Create timeout promise
        const timeoutPromise = createTimeoutPromise(
          PAYMENT_CONSTANTS.PAYMENT_LINK_TIMEOUT,
          "Payment link creation timed out"
        );

        try {
          const amountInCents = Math.round(amount * 100);

          console.log("💰 Payment link creation:", {
            originalAmount: amount,
            amountInCents,
            currency,
          });

          const paymentResponse = (await Promise.race([
            StripePaymentService.createPaymentLink({
              handyproUserId: userId,
              customerName: userFullName || "Customer",
              customerEmail: userEmail || undefined,
              description: `Payment request for $${amount.toFixed(
                2
              )} ${currency}`,
              amount: amountInCents,
              taskDetails: `Payment of $${amount.toFixed(2)} ${currency}`,
              currency: currency,
              paymentSource: "qr_generation", // Mark as QR generation
            }),
            timeoutPromise,
          ])) as any;

          paymentUrl = paymentResponse.payment_link;
          linkId = paymentResponse.id;
          console.log("✅ Payment link created:", paymentUrl);
          console.log("🔗 Payment link ID:", linkId);
        } catch (paymentError) {
          console.error("❌ Error creating Stripe payment link:", paymentError);

          const errorObj =
            paymentError instanceof Error
              ? paymentError
              : new Error("Unknown error");
          const userFriendlyMessage = getErrorMessage(errorObj.message);

          console.log("🔧 QR Generation error details:", {
            originalError: errorObj.message,
            userFriendlyMessage,
            userId,
          });

          setState((prev) => ({
            ...prev,
            error: userFriendlyMessage,
            loading: false,
            isRefreshing: false,
          }));

          Toast.show({
            type: "error",
            text1: "Payment Link Failed",
            text2: userFriendlyMessage,
          });

          return;
        }
      }

      if (!paymentUrl) {
        throw new Error("No payment URL available");
      }

      // Store the payment URL and ID for QR generation
      console.log("🎨 Payment URL ready for QR:", paymentUrl);
      setState((prev) => ({
        ...prev,
        paymentUrl,
        paymentLinkId: linkId,
        loading: false,
        isRefreshing: false,
        error: null,
      }));

      // Trigger QR code pop animation
      triggerQRAnimation();
    } catch (error) {
      console.error("❌ QR Generation failed:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to generate QR code",
        loading: false,
        isRefreshing: false,
      }));
    }
  }, [
    amount,
    currency,
    initialPaymentLink,
    userId,
    userFullName,
    userEmail,
    triggerQRAnimation,
  ]);

  const refreshQRCode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRefreshing: true,
      loading: true,
      error: null,
      paymentUrl: null,
      paymentLinkId: null,
    }));

    // Re-run the QR generation after a short delay
    setTimeout(() => {
      generateQRCode();
    }, PAYMENT_CONSTANTS.RETRY_DELAY);
  }, [generateQRCode]);

  return {
    ...state,
    qrScaleAnimation,
    generateQRCode,
    refreshQRCode,
    triggerQRAnimation,
  };
};
