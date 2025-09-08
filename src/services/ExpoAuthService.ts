import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import { Linking, Platform } from "react-native";
import { authClient, apiService } from "./api";

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

        // Use Better Auth's Apple sign-in to create a proper server session
        const authResult = await authClient.signIn.social({
          provider: "apple",
          callbackURL: "handypay://auth/callback",
        });

        if (authResult.data?.session) {
          console.log("✅ Better Auth Apple session created");

          // Verify the session was created
          const session = await authClient.getSession();
          if (session.data?.user) {
            console.log("✅ Session verified:", session.data.user.id);

            // Create user data from the authenticated session
            const userData = {
              id: session.data.user.id,
              email: session.data.user.email || credential.email || null,
              fullName: session.data.user.name || null,
              firstName: credential.fullName?.givenName || null,
              lastName: credential.fullName?.familyName || null,
              authProvider: "apple" as const,
              appleUserId: credential.user || session.data.user.id,
              googleUserId: null,
              stripeAccountId: session.data.user.stripeAccountId || null,
              stripeOnboardingCompleted:
                session.data.user.stripeOnboardingCompleted || false,
              memberSince:
                session.data.user.createdAt || new Date().toISOString(),
              faceIdEnabled: session.data.user.faceIdEnabled || false,
              safetyPinEnabled: session.data.user.safetyPinEnabled || false,
              avatarUri: session.data.user.image || undefined,
            };

            console.log("✅ Apple authentication successful:", userData.id);

            return {
              type: "success",
              params: credential,
              userData: userData,
              session: session.data,
            };
          } else {
            console.error("❌ Session created but user data missing");
            return {
              type: "error",
              error: {
                code: "SESSION_ERROR",
                message: "Session created but user data is missing",
              },
            };
          }
        } else {
          console.error(
            "❌ Better Auth Apple sign-in failed:",
            authResult.error
          );
          return {
            type: "error",
            error: {
              code: "AUTH_FAILED",
              message: "Better Auth authentication failed",
              details: authResult.error?.message || "Unknown error",
            },
          };
        }
      } catch (authError) {
        console.error("❌ Better Auth integration error:", authError);
        return {
          type: "error",
          error: {
            code: "AUTH_ERROR",
            message: "Failed to authenticate with server",
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

// Use Google OAuth with Better Auth integration
export const useGoogleAuth = () => {
  // Only log in development mode to reduce console spam
  if (__DEV__) {
    console.log("Google Auth Setup (Better Auth):", {
      clientId: !!GOOGLE_CLIENT_ID,
      oauthUrl: GOOGLE_OAUTH_URL,
      isDevelopment: __DEV__,
    });
  }

  const promptAsync = async () => {
    try {
      console.log("Starting Google OAuth flow with Better Auth...");

      // Use Better Auth's Google sign-in to create a proper server session
      try {
        console.log(
          "🔐 Creating authenticated session with Better Auth for Google..."
        );

        const authResult = await authClient.signIn.social({
          provider: "google",
          callbackURL: "handypay://auth/callback",
        });

        if (authResult.data?.session) {
          console.log("✅ Better Auth Google session created");

          // Verify the session was created
          const session = await authClient.getSession();
          if (session.data?.user) {
            console.log("✅ Session verified:", session.data.user.id);

            // Create user data from the authenticated session
            const userData = {
              id: session.data.user.id,
              email: session.data.user.email || null,
              fullName: session.data.user.name || null,
              firstName: session.data.user.name?.split(" ")[0] || null,
              lastName:
                session.data.user.name?.split(" ").slice(1).join(" ") || null,
              authProvider: "google" as const,
              appleUserId: null,
              googleUserId: session.data.user.id,
              stripeAccountId: session.data.user.stripeAccountId || null,
              stripeOnboardingCompleted:
                session.data.user.stripeOnboardingCompleted || false,
              memberSince:
                session.data.user.createdAt || new Date().toISOString(),
              faceIdEnabled: session.data.user.faceIdEnabled || false,
              safetyPinEnabled: session.data.user.safetyPinEnabled || false,
              avatarUri: session.data.user.image || undefined,
            };

            console.log("✅ Google authentication successful:", userData.id);

            return {
              type: "success",
              params: {},
              userData: userData,
              session: session.data,
            };
          } else {
            console.error("❌ Session created but user data missing");
            return {
              type: "error",
              error: {
                code: "SESSION_ERROR",
                message: "Session created but user data is missing",
              },
            };
          }
        } else {
          console.error(
            "❌ Better Auth Google sign-in failed:",
            authResult.error
          );
          return {
            type: "error",
            error: {
              code: "AUTH_FAILED",
              message: "Better Auth Google authentication failed",
              details: authResult.error?.message || "Unknown error",
            },
          };
        }
      } catch (authError) {
        console.error("❌ Better Auth Google integration error:", authError);
        return {
          type: "error",
          error: {
            code: "AUTH_ERROR",
            message: "Failed to authenticate with server",
            details:
              authError instanceof Error
                ? authError.message
                : "Unknown auth error",
          },
        };
      }
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
