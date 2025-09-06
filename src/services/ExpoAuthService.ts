import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import { Linking, Platform } from "react-native";

// Backend API URL for token verification
const API_URL = "https://handypay-backend.handypay.workers.dev";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

// Use backend-based OAuth flow - redirect to our backend for OAuth initiation
const GOOGLE_OAUTH_URL = `${API_URL}/auth/google`;

// Only log in development mode to reduce console spam
if (__DEV__) {
  console.log("🔗 API_URL configured as:", API_URL);
  console.log("🔗 Google OAuth URL:", GOOGLE_OAUTH_URL);
  console.log("🔗 Google Client ID configured:", !!GOOGLE_CLIENT_ID);
}

// Use native Apple Authentication instead of OAuth web flow
export const useAppleAuth = () => {
  // Only log in development mode to reduce console spam
  if (__DEV__) {
    console.log("Apple Auth Setup (Native):", {
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

      return {
        type: "success",
        params: credential,
      };
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

// Use Google OAuth with backend proxy
export const useGoogleAuth = () => {
  // Only log in development mode to reduce console spam
  if (__DEV__) {
    console.log("Google Auth Setup:", {
      clientId: !!GOOGLE_CLIENT_ID,
      oauthUrl: GOOGLE_OAUTH_URL,
      isDevelopment: __DEV__,
    });
  }

  const promptAsync = async () => {
    try {
      console.log("Starting Google OAuth flow via backend...");

      // Generate a state parameter for security
      const state = Math.random().toString(36).substring(7);

      // Construct the backend OAuth URL - Use production callback even in development
      const oauthUrl = new URL(GOOGLE_OAUTH_URL);
      oauthUrl.searchParams.set("state", state);
      // Use the correct Better Auth callback URL
      oauthUrl.searchParams.set(
        "redirect_uri",
        `${API_URL}/auth/callback/google`
      );

      console.log("🔗 OAuth URL being constructed:", oauthUrl.toString());
      console.log("🔗 Using callback URL:", `${API_URL}/auth/callback/google`);

      console.log("Redirecting to backend OAuth URL:", oauthUrl.toString());

      // Open the backend OAuth URL in the browser
      const supported = await Linking.canOpenURL(oauthUrl.toString());
      if (!supported) {
        throw new Error("Cannot open OAuth URL");
      }

      await Linking.openURL(oauthUrl.toString());

      // Return a pending state - the actual result will come via deep link
      return {
        type: "pending",
        state: state,
      };
    } catch (error: any) {
      console.error("Google auth error:", error);
      return {
        type: "error",
        error: {
          message: error.message || "Google authentication failed",
          code: error.code || "UNKNOWN_ERROR",
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
