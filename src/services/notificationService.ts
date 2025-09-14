import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

// Notification keys for AsyncStorage
const NOTIFICATIONS_ENABLED_KEY = "@handypay_notifications_enabled";
const PUSH_TOKEN_KEY = "@handypay_push_token";

// WebSocket connection
let websocket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3 seconds

export class NotificationService {
  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log("🔔 Requesting notification permissions...");

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === "granted") {
        console.log("✅ Notification permissions granted");
        return true;
      } else {
        console.log("❌ Notification permissions denied:", status);
        return false;
      }
    } catch (error) {
      console.error("❌ Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * Get the push token for this device
   */
  static async getPushToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;
      console.log("📱 Push token obtained:", pushToken);
      return pushToken;
    } catch (tokenError) {
      console.warn("⚠️ Could not get push token:", tokenError);
      return null;
    }
  }

  /**
   * Set up notification channels for Android
   */
  static async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3AB75C",
        });

        await Notifications.setNotificationChannelAsync("payments", {
          name: "Payments",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3AB75C",
        });

        console.log("📱 Android notification channels configured");
      } catch (channelError) {
        console.error(
          "❌ Error setting up notification channels:",
          channelError
        );
      }
    }
  }

  /**
   * Save notification preferences to AsyncStorage and backend
   */
  static async saveNotificationPreferences(
    enabled: boolean,
    pushToken?: string | null
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled.toString());
      if (pushToken) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);
      }
      console.log("💾 Notification preferences saved locally");

      // If we have a push token and user data, sync to backend
      if (pushToken && enabled) {
        await this.syncTokenToBackend(pushToken);
      }
    } catch (storageError) {
      console.error("❌ Error saving notification preferences:", storageError);
    }
  }

  /**
   * Sync push token to backend
   */
  static async syncTokenToBackend(pushToken: string): Promise<void> {
    try {
      // Get current user data
      const userDataString = await AsyncStorage.getItem("@handypay_user_data");
      if (!userDataString) {
        console.log("⚠️ No user data found, skipping backend sync");
        return;
      }

      const userData = JSON.parse(userDataString);
      if (!userData?.id) {
        console.log("⚠️ Invalid user data, skipping backend sync");
        return;
      }

      // Determine device type
      const deviceType = Platform.OS;

      // Get unique device ID (using a simple hash for now)
      const deviceId = `device_${userData.id}_${deviceType}_${Date.now()}`;

      const response = await fetch(
        "https://handypay-backend.handypay.workers.dev/api/push-notifications/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userData.id,
            "X-User-Provider": userData.authProvider,
          },
          body: JSON.stringify({
            userId: userData.id,
            token: pushToken,
            deviceType,
            deviceId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Push token synced to backend:", result.tokenId);
      } else {
        console.warn(
          "⚠️ Failed to sync push token to backend:",
          response.status
        );
      }
    } catch (error) {
      console.warn("⚠️ Error syncing push token to backend:", error);
      // Don't throw - this shouldn't break the notification setup
    }
  }

  /**
   * Get saved notification preferences
   */
  static async getNotificationPreferences(): Promise<{
    enabled: boolean;
    pushToken: string | null;
  }> {
    try {
      const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      const pushToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

      return {
        enabled: enabled === "true",
        pushToken: pushToken || null,
      };
    } catch (error) {
      console.error("❌ Error getting notification preferences:", error);
      return { enabled: false, pushToken: null };
    }
  }

  /**
   * Schedule a test notification to verify everything is working
   */
  static async scheduleTestNotification(): Promise<string | null> {
    try {
      console.log("📬 Scheduling test notification...");

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Notifications Enabled",
          body: "You'll now receive instant alerts when payments come through.",
          data: { type: "test" },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      console.log(
        "✅ Test notification scheduled successfully with ID:",
        notificationId
      );
      return notificationId;
    } catch (error) {
      console.error("❌ Could not schedule test notification:", error);
      return null;
    }
  }

  /**
   * Schedule an immediate notification (for testing)
   */
  static async scheduleImmediateNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test",
          body: "Immediate notification test",
          data: { type: "immediate_test" },
        },
        trigger: null, // Immediate
      });

      console.log("✅ Immediate test notification sent");
    } catch (error) {
      console.error("❌ Could not send immediate notification:", error);
    }
  }

  /**
   * Complete notification setup process
   */
  static async setupNotifications(): Promise<{
    success: boolean;
    pushToken?: string;
  }> {
    try {
      // Request permissions
      const permissionsGranted = await this.requestPermissions();

      if (!permissionsGranted) {
        await this.saveNotificationPreferences(false);
        return { success: false };
      }

      // Get push token
      const pushToken = await this.getPushToken();

      // Set up channels for Android
      await this.setupNotificationChannels();

      // Save preferences
      await this.saveNotificationPreferences(true, pushToken);

      // Schedule test notification
      await this.scheduleTestNotification();

      return { success: true, pushToken: pushToken || undefined };
    } catch (error) {
      console.error("❌ Error setting up notifications:", error);
      return { success: false };
    }
  }

  /**
   * Check if notifications are currently enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("❌ Error checking notification status:", error);
      return false;
    }
  }

  /**
   * Initialize notification handler (call this once in the app)
   */
  static initializeNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Set up notification listener for general notifications (payments, etc.)
   * Ban detection now uses simple polling instead of push notifications
   */
  static setupGeneralNotificationListener(): void {
    // Keep this for future use - payments, payouts, etc.
    // For now, ban detection is handled via polling
    console.log(
      "🔔 General notification listener setup (ban detection uses polling)"
    );
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  static connectWebSocket(userId: string): void {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      console.log("🔗 WebSocket already connected");
      return;
    }

    try {
      // Use secure WebSocket connection
      const wsUrl = `wss://handypay-backend.handypay.workers.dev/ws?userId=${userId}`;
      console.log("🔗 Connecting to WebSocket:", wsUrl);

      websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log("✅ WebSocket connected successfully");
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", data);

          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      websocket.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.code, event.reason);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(
            `🔄 Attempting to reconnect (${
              reconnectAttempts + 1
            }/${MAX_RECONNECT_ATTEMPTS})`
          );
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            this.connectWebSocket(userId);
          }, RECONNECT_INTERVAL);
        }
      };

      websocket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  static disconnectWebSocket(): void {
    console.log("🔌 Disconnecting WebSocket...");

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (websocket) {
      websocket.close(1000, "Client disconnecting");
      websocket = null;
    }

    reconnectAttempts = 0;
  }

  /**
   * Handle incoming WebSocket messages
   */
  static handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case "onboarding_complete":
        console.log("🎉 Onboarding completed via WebSocket!");
        Toast.show({
          type: "success",
          text1: "Onboarding Completed!",
          text2: "Your account is now ready to accept payments.",
        });
        // Trigger onboarding completion in the UI
        this.notifyOnboardingComplete();
        break;

      case "onboarding_failed":
        console.log("❌ Onboarding failed via WebSocket");
        Toast.show({
          type: "error",
          text1: "Onboarding Failed",
          text2:
            data.message || "There was an error with your Stripe onboarding.",
        });
        break;

      case "payment_received":
        console.log("💰 Payment received via WebSocket");
        Toast.show({
          type: "success",
          text1: "Payment Received!",
          text2: `You received ${data.amount} ${data.currency}`,
        });
        break;

      default:
        console.log("📨 Unknown WebSocket message type:", data.type);
    }
  }

  /**
   * Notify listeners about onboarding completion
   */
  static notifyOnboardingComplete(): void {
    // Emit custom event that components can listen to
    if (typeof window !== "undefined" && (window as any).Event) {
      const event = new CustomEvent("onboardingComplete");
      window.dispatchEvent(event);
    }
  }

  /**
   * Set up onboarding completion listener
   */
  static onOnboardingComplete(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = () => callback();
    window.addEventListener("onboardingComplete", handler);

    // Return cleanup function
    return () => {
      window.removeEventListener("onboardingComplete", handler);
    };
  }

  /**
   * Initialize the notification service (call this in App.tsx or main entry point)
   */
  static async initialize(): Promise<void> {
    try {
      console.log("🔔 Initializing notification service...");

      // Set up notification handler
      this.initializeNotificationHandler();

      // Check current permission status
      const enabled = await this.areNotificationsEnabled();
      console.log(
        "🔔 Current notification status:",
        enabled ? "enabled" : "disabled"
      );

      // Get existing preferences
      const preferences = await this.getNotificationPreferences();
      if (preferences.pushToken) {
        console.log("📱 Existing push token found");
      }

      console.log("✅ Notification service initialized");
    } catch (error) {
      console.error("❌ Error initializing notification service:", error);
    }
  }
}
