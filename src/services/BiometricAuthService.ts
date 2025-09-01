import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { Alert } from "react-native";

export interface BiometricResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

export interface BiometricInfo {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: string;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

class BiometricAuthService {
  private static instance: BiometricAuthService;
  private biometricInfo: BiometricInfo | null = null;

  public static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric authentication is available and get device info
   */
  async getBiometricInfo(): Promise<BiometricInfo> {
    if (this.biometricInfo) {
      return this.biometricInfo;
    }

    try {
      // Check if hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        this.biometricInfo = {
          isAvailable: false,
          isEnrolled: false,
          biometricType: "None",
          supportedTypes: [],
        };
        return this.biometricInfo;
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Determine biometric type
      let biometricType = "Biometric";
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        biometricType = "Face ID";
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        biometricType = "Touch ID";
      }

      this.biometricInfo = {
        isAvailable: hasHardware,
        isEnrolled,
        biometricType,
        supportedTypes,
      };

      return this.biometricInfo;
    } catch (error) {
      console.error("❌ Error getting biometric info:", error);
      this.biometricInfo = {
        isAvailable: false,
        isEnrolled: false,
        biometricType: "None",
        supportedTypes: [],
      };
      return this.biometricInfo;
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticate(
    promptMessage?: string,
    allowPasscodeFallback: boolean = false
  ): Promise<BiometricResult> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const biometricInfo = await this.getBiometricInfo();

      if (!biometricInfo.isAvailable && !allowPasscodeFallback) {
        return {
          success: false,
          error: "Biometric authentication is not available on this device",
        };
      }

      if (!biometricInfo.isEnrolled && !allowPasscodeFallback) {
        return {
          success: false,
          error: `${biometricInfo.biometricType} is not set up on this device`,
        };
      }

      // If allowing passcode fallback, use device passcode as primary option
      const defaultMessage = allowPasscodeFallback
        ? `Use ${biometricInfo.biometricType} or device passcode to authenticate`
        : `Use ${biometricInfo.biometricType} to authenticate`;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || defaultMessage,
        cancelLabel: "Cancel",
        disableDeviceFallback: !allowPasscodeFallback, // Allow passcode if requested
      });

      if (result.success) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        return { success: true };
      } else {
        // Type assertion needed since result is not successful here
        const failedResult = result as any;
        return {
          success: false,
          error: failedResult.error,
          cancelled:
            failedResult.error === "UserCancel" ||
            failedResult.error === "system_cancel",
        };
      }
    } catch (error) {
      console.error("❌ Biometric authentication error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  /**
   * Authenticate with user-friendly error handling and alerts
   */
  async authenticateWithPrompt(
    promptMessage?: string,
    options?: {
      showErrorAlert?: boolean;
      allowRetry?: boolean;
      allowPasscodeFallback?: boolean;
      onSuccess?: () => void;
      onError?: (error: string) => void;
      onCancel?: () => void;
    }
  ): Promise<boolean> {
    const {
      showErrorAlert = true,
      allowRetry = true,
      allowPasscodeFallback = false,
      onSuccess,
      onError,
      onCancel,
    } = options || {};

    const result = await this.authenticate(
      promptMessage,
      allowPasscodeFallback
    );

    if (result.success) {
      onSuccess?.();
      return true;
    }

    if (result.cancelled) {
      onCancel?.();
      return false;
    }

    const errorMessage = result.error || "Authentication failed";
    onError?.(errorMessage);

    if (showErrorAlert) {
      const buttons = allowRetry
        ? [
            { text: "Cancel", style: "cancel" as const },
            {
              text: "Try Again",
              onPress: () =>
                this.authenticateWithPrompt(promptMessage, options),
            },
          ]
        : [{ text: "OK" }];

      Alert.alert("Authentication Failed", errorMessage, buttons);
    }

    return false;
  }

  /**
   * Check if biometric authentication should be used (user has it set up)
   */
  async shouldUseBiometricAuth(): Promise<boolean> {
    const info = await this.getBiometricInfo();
    return info.isAvailable && info.isEnrolled;
  }

  /**
   * Get a user-friendly description of available biometric type
   */
  async getBiometricTypeDescription(): Promise<string> {
    const info = await this.getBiometricInfo();
    if (!info.isAvailable) {
      return "Biometric authentication is not available";
    }
    if (!info.isEnrolled) {
      return `${info.biometricType} is not set up`;
    }
    return info.biometricType;
  }

  /**
   * Clear cached biometric info (useful after settings changes)
   */
  clearCache(): void {
    this.biometricInfo = null;
  }
}

export default BiometricAuthService.getInstance();
