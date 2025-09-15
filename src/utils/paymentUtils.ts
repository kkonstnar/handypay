import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper function to format amounts with commas (same as home page)
export function formatDisplayAmount(amount: number): string {
  const amountStr = amount.toFixed(2);
  const [wholePart, decimalPart] = amountStr.split(".");
  const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${formattedWhole}.${decimalPart}`;
}

// Constants
export const PAYMENT_CONSTANTS = {
  MINIMUM_USD: 1.0,
  DEFAULT_EXCHANGE_RATE: 156,
  PAYMENT_LINK_TIMEOUT: 30000,
  STATUS_CHECK_TIMEOUT: 10000,
  STATUS_POLLING_INTERVAL: 5000,
  POLLING_START_DELAY: 2000,
  RETRY_DELAY: 500,
  QR_SIZE: 240,
  QR_ANIMATION_DURATION: 400,
  CACHE_EXPIRY_HOURS: 24,
} as const;

// Exchange rate utilities
export const getExchangeRate = async (): Promise<number> => {
  try {
    // Try to get fresh rate from API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data.rates.JMD;
      // Cache the rate for offline use
      await AsyncStorage.setItem("usd_to_jmd_rate", rate.toString());
      await AsyncStorage.setItem("rate_timestamp", Date.now().toString());
      return rate;
    }
  } catch (error) {
    console.log("Exchange rate API failed, using cached rate");
  }

  // Fallback to cached rate or default
  try {
    const cachedRate = await AsyncStorage.getItem("usd_to_jmd_rate");
    const rateTimestamp = await AsyncStorage.getItem("rate_timestamp");

    if (cachedRate && rateTimestamp) {
      const age = Date.now() - parseInt(rateTimestamp);
      // Use cached rate if less than 24 hours old
      if (age < PAYMENT_CONSTANTS.CACHE_EXPIRY_HOURS * 60 * 60 * 1000) {
        return parseFloat(cachedRate);
      }
    }
  } catch (error) {
    console.log("Failed to get cached rate");
  }

  // Final fallback
  return PAYMENT_CONSTANTS.DEFAULT_EXCHANGE_RATE;
};

// Amount validation
export const validateMinimumAmount = async (
  amount: number,
  currency: string
): Promise<{ isValid: boolean; errorMessage?: string }> => {
  const exchangeRate = await getExchangeRate();

  let minimumAmount: number;
  let errorMsg: string;

  if (currency === "USD") {
    minimumAmount = PAYMENT_CONSTANTS.MINIMUM_USD;
    errorMsg = `Amount must be at least $${PAYMENT_CONSTANTS.MINIMUM_USD.toFixed(
      2
    )} USD to meet Stripe's minimum requirement.`;
  } else {
    // For JMD, convert USD minimum to JMD equivalent
    minimumAmount = PAYMENT_CONSTANTS.MINIMUM_USD * exchangeRate;
    errorMsg = `Amount must be at least $${minimumAmount.toFixed(
      2
    )} JMD ($${PAYMENT_CONSTANTS.MINIMUM_USD.toFixed(
      2
    )} USD) to meet Stripe's minimum requirement.`;
  }

  if (amount < minimumAmount) {
    return { isValid: false, errorMessage: errorMsg };
  }

  return { isValid: true };
};

// Generate personalized share message
export const generateShareMessage = (
  userFirstName: string,
  amount: number,
  currency: string,
  paymentUrl: string,
  includeUrl: boolean = true
): string => {
  const baseMessage = `Pay ${userFirstName} $${formatDisplayAmount(
    amount
  )} ${currency} using this secure payment link:`;
  return includeUrl ? `${baseMessage}\n\n${paymentUrl}` : baseMessage;
};

// Error message mapping
export const getErrorMessage = (errorMessage: string): string => {
  if (
    errorMessage.includes("payment method") ||
    errorMessage.includes("payment method types")
  ) {
    return "Payment methods not properly configured. Please check your Stripe account settings or contact support";
  } else if (errorMessage.includes("account not ready")) {
    return "Your Stripe account needs onboarding completion";
  } else if (
    errorMessage.includes("destination") ||
    errorMessage.includes("jamaica")
  ) {
    return "Jamaican accounts require destination charges setup. Contact support to configure your account";
  } else if (errorMessage.includes("timeout")) {
    return "Request timed out. Please try again";
  } else if (
    errorMessage.includes("401") ||
    errorMessage.includes("Unauthorized")
  ) {
    return "Authentication error. Please log out and log back in";
  } else if (errorMessage.includes("500")) {
    return "Server error. Please try again in a few minutes";
  }

  return "Please check your Stripe setup and try again";
};

// Create timeout promise
export const createTimeoutPromise = (
  timeout: number,
  message: string = "Operation timed out"
) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), timeout)
  );
};
