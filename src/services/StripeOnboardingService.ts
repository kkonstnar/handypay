import { UserData } from "../contexts/UserContext";

export interface StripeOnboardingState {
  isPreloading: boolean;
  preloadedUrl: string | null;
  error: string | null;
}

export interface StripeAccountData {
  stripeAccountId: string;
  stripeOnboardingComplete: boolean;
  kycStatus: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

export interface UserProfile {
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  kycStatus: string;
}

class StripeOnboardingManager {
  private static instance: StripeOnboardingManager;
  private state: StripeOnboardingState = {
    isPreloading: false,
    preloadedUrl: null,
    error: null,
  };

  private constructor() {}

  static getInstance(): StripeOnboardingManager {
    if (!StripeOnboardingManager.instance) {
      StripeOnboardingManager.instance = new StripeOnboardingManager();
    }
    return StripeOnboardingManager.instance;
  }

  getState(): StripeOnboardingState {
    return { ...this.state };
  }

  async startPreloading(user: UserData): Promise<void> {
    if (this.state.isPreloading || this.state.preloadedUrl) {
      console.log("Stripe onboarding already preloading or preloaded");
      return;
    }

    this.state.isPreloading = true;
    this.state.error = null;

    try {
      console.log("🚀 Starting Stripe onboarding preload for user:", user.id);

      const response = await fetch(
        "https://handypay-backend.handypay.workers.dev/api/stripe/create-account-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            firstName:
              user.firstName ||
              (user.fullName ? user.fullName.split(" ")[0] : "User"),
            lastName:
              user.lastName ||
              (user.fullName
                ? user.fullName.split(" ").slice(1).join(" ")
                : "Unknown"),
            email: user.email || "user@handypay.com",
            refresh_url:
              "https://handypay-backend.handypay.workers.dev/stripe/refresh",
            return_url:
              "https://handypay-backend.handypay.workers.dev/stripe/return",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Stripe account link");
      }

      console.log("✅ Stripe onboarding URL preloaded:", data.url);
      this.state.preloadedUrl = data.url;
      this.state.error = null;
    } catch (error) {
      console.error("❌ Error preloading Stripe onboarding:", error);
      this.state.error =
        error instanceof Error ? error.message : "Failed to preload onboarding";
    } finally {
      this.state.isPreloading = false;
    }
  }

  getPreloadedUrl(): string | null {
    return this.state.preloadedUrl;
  }

  hasError(): boolean {
    return this.state.error !== null;
  }

  getError(): string | null {
    return this.state.error;
  }

  reset(): void {
    this.state = {
      isPreloading: false,
      preloadedUrl: null,
      error: null,
    };
  }

  isReady(): boolean {
    return (
      !this.state.isPreloading &&
      this.state.preloadedUrl !== null &&
      !this.state.error
    );
  }

  // Get Stripe account data using the existing deployed API
  async getStripeAccount(
    stripeAccountId: string
  ): Promise<StripeAccountData | null> {
    try {
      console.log(`🔍 Fetching Stripe account data for: ${stripeAccountId}`);

      const response = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/account-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stripeAccountId }),
        }
      );

      if (!response.ok) {
        console.error(`❌ Failed to fetch Stripe account: ${response.status}`);
        return null;
      }

      const accountData = await response.json();

      if (!accountData.success) {
        console.error(`❌ Account status error:`, accountData.error);
        return null;
      }
      console.log(`✅ Stripe account data retrieved:`, accountData);

      // Transform the response to match our interface
      const accountStatus = accountData.accountStatus;
      return {
        stripeAccountId: accountStatus.id,
        stripeOnboardingComplete: accountStatus.charges_enabled, // Use charges_enabled as completion indicator
        kycStatus: accountStatus.details_submitted ? "completed" : "pending",
        charges_enabled: accountStatus.charges_enabled,
        payouts_enabled: accountStatus.payouts_enabled,
        details_submitted: accountStatus.details_submitted,
      };
    } catch (error) {
      console.error("❌ Error fetching Stripe account:", error);
      return null;
    }
  }

  // Get user profile data including Stripe status
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log(`🔍 Fetching user profile for: ${userId}`);

      // Use the existing backend endpoint to get user account data
      const response = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${userId}`
      );

      if (!response.ok) {
        console.error(`❌ Failed to fetch user profile: ${response.status}`);
        return null;
      }

      const profile = await response.json();

      // Transform the response to match our UserProfile interface
      return {
        stripeAccountId: profile.stripeAccountId,
        stripeOnboardingComplete: false, // We'll get this from account status
        kycStatus: "unknown", // We'll get this from account status
      };
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      return null;
    }
  }

  // Create or update Stripe Connect account using the new API pattern
  async createStripeAccount(
    user: UserData
  ): Promise<{ url: string; accountId: string } | null> {
    try {
      console.log(`🚀 Creating Stripe account for user: ${user.id}`);

      const requestData = {
        userId: user.id,
        firstName:
          user.firstName ||
          (user.fullName ? user.fullName.split(" ")[0] : "User"),
        lastName:
          user.lastName ||
          (user.fullName
            ? user.fullName.split(" ").slice(1).join(" ")
            : "Unknown"),
        email: user.email || "user@handypay.com",
        refresh_url:
          "https://handypay-backend.handypay.workers.dev/stripe/refresh",
        return_url:
          "https://handypay-backend.handypay.workers.dev/stripe/return",
      };

      const response = await fetch(
        "https://handypay-backend.handypay.workers.dev/api/stripe/create-account-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Stripe account link");
      }

      console.log(`✅ Stripe account created:`, {
        accountId: data.accountId,
        url: data.url ? "present" : "missing",
      });

      return {
        url: data.url,
        accountId: data.accountId,
      };
    } catch (error) {
      console.error("❌ Error creating Stripe account:", error);
      return null;
    }
  }
}

export const stripeOnboardingManager = StripeOnboardingManager.getInstance();
