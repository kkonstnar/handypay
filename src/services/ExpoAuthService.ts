import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";
import { authClient, apiService } from "./api";

// Backend API URL
const API_BASE_URL = "https://handypay-backend.handypay.workers.dev";

// Create the redirect URI for OAuth callbacks
const REDIRECT_URI = "handypay://auth/callback";

// Only log in development mode to reduce console spam
if (__DEV__) {
  console.log("🔗 Better Auth configured for Google OAuth");
}

// Use native Apple Authentication with Better Auth integration
export const useAppleAuth = () => {
  // Only log in development mode to reduce console spam
  if (__DEV__) {
    console.log("Apple Auth Setup (Native + Better Auth):", {
      isAvailable: AppleAuthentication.isAvailableAsync,
      isDevelopment: __DEV__,
    });
  }

  const promptAsync = async () => {
    try {
      // First check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log("Apple Sign-In availability:", isAvailable);

      if (!isAvailable) {
        return {
          type: "error",
          error: {
            code: "ERR_NOT_AVAILABLE",
            message: "Apple Sign-In is not available on this device/build",
            setupInstructions:
              "This may be due to missing entitlements or capabilities in your EAS build",
          },
        };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("🍎 Apple credential received:", {
        user: credential.user,
        hasEmail: !!credential.email,
        hasName: !!credential.fullName,
      });

      // Create authenticated session with Better Auth
      try {
        console.log("🔐 Creating authenticated session with Better Auth...");
        console.log("🔍 authClient:", authClient);
        console.log("🔍 authClient.signIn:", authClient.signIn);

        // Use Better Auth's Apple sign-in to create a proper server session
        const authResult = await authClient.signIn.social({
          provider: "apple",
        });

        // Create user data from the credential
        console.log("🔐 Apple sign-in initiated, result:", authResult);

        const userData = {
          id: credential.user,
          email: credential.email || null,
          fullName: credential.fullName
            ? `${credential.fullName.givenName || ""} ${
                credential.fullName.familyName || ""
              }`.trim()
            : null,
          firstName: credential.fullName?.givenName || null,
          lastName: credential.fullName?.familyName || null,
          authProvider: "apple" as const,
          appleUserId: credential.user,
          googleUserId: null,
          stripeAccountId: null,
          stripeOnboardingCompleted: false,
          memberSince: new Date().toISOString(),
          faceIdEnabled: false,
          safetyPinEnabled: false,
          avatarUri: undefined,
        };

        return {
          type: "success",
          params: credential,
          userData: userData,
        };
      } catch (authError) {
        console.error("❌ Apple auth error:", authError);
        return {
          type: "error",
          error: {
            code: "AUTH_ERROR",
            message: "Failed to authenticate with Apple",
            details:
              authError instanceof Error
                ? authError.message
                : "Unknown auth error",
          },
        };
      }
    } catch (error: any) {
      if (error.code === "ERR_CANCELED") {
        return { type: "cancel" };
      } else {
        console.error("Apple auth error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
          platform: Platform.OS,
          isDev: __DEV__,
        });

        // Provide more specific error information for EAS build issues
        const enhancedError = {
          ...error,
          message: error.message || "Unknown error",
          setupInstructions:
            error.code === "ERR_REQUEST_UNKNOWN"
              ? "Apple Sign In requires setup in Apple Developer Console and App Store Connect for bundle ID: com.handypay.mobile. Check that your provisioning profile has Apple Sign-In capability enabled."
              : error.code === "ERR_NOT_AVAILABLE"
              ? "Apple Sign-In capability is not available. This may be due to missing entitlements in your EAS build configuration."
              : "Check Apple Developer Console configuration and EAS build settings.",
        };

        return { type: "error", error: enhancedError };
      }
    }
  };

  return {
    request: true, // Always ready for native Apple auth
    response: null,
    promptAsync,
  };
};

// Use Google OAuth with proper browser-based flow
export const useGoogleAuth = () => {
  // Only log in development mode to reduce console spam
  if (__DEV__) {
    console.log("Google Auth Setup (Browser OAuth):", {
      isDevelopment: __DEV__,
    });
  }

  const promptAsync = async () => {
    try {
      console.log("🔐 Starting Google OAuth with browser redirect...");

      // Create the Google OAuth URL using the backend's manual implementation
      const oauthUrl = `${API_BASE_URL}/auth/google`;

      console.log("🌐 Opening browser for Google OAuth:", oauthUrl);

      // Use WebBrowser to open the OAuth URL
      const browserResult = await WebBrowser.openBrowserAsync(oauthUrl, {
        dismissButtonStyle: "cancel",
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });

      console.log("🔐 WebBrowser result:", browserResult);

      // After the browser closes, we need to wait for the deep link callback
      // This is handled by the Linking listener in StartPage.tsx
      // For now, return success assuming the OAuth flow will complete
      return {
        type: "success",
        params: browserResult,
        userData: null, // Will be populated by the deep link handler
      };
    } catch (error: any) {
      console.error("❌ Google auth error:", error);
      return {
        type: "error",
        error: {
          code: "AUTH_ERROR",
          message: "Failed to authenticate with Google",
          details: error instanceof Error ? error.message : "Unknown auth error",
        },
      };
    }
  };

  return {
    request: null,
    response: null,
    promptAsync,
  };
};

// Helper function to decode Apple ID token (basic JWT decode)
export const decodeAppleIdToken = (idToken: string) => {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid ID token format");
    }

    const payload = parts[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch (error) {
    console.error("Error decoding Apple ID token:", error);
    throw error;
  }
};
