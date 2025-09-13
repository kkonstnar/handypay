import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Notification keys for AsyncStorage
const NOTIFICATIONS_ENABLED_KEY = "@handypay_notifications_enabled";
const PUSH_TOKEN_KEY = "@handypay_push_token";

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
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  /**
   * Set up notification listener for ban status updates
   */
  static setupBanNotificationListener(
    onBanNotification: (banDetails: any) => void
  ): void {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;

        if (data?.type === "account_banned") {
          console.log("🚫 Received ban notification:", data);
          onBanNotification(data.banDetails);
        }
      }
    );

    // Also listen for notifications when app is in background
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.type === "account_banned") {
          console.log("🚫 User tapped ban notification:", data);
          onBanNotification(data.banDetails);
        }
      });

    // Store subscriptions for cleanup if needed
    (this as any)._banSubscriptions = [subscription, responseSubscription];
  }

  /**
   * Clean up ban notification listeners
   */
  static cleanupBanNotificationListeners(): void {
    const subscriptions = (this as any)._banSubscriptions;
    if (subscriptions) {
      subscriptions.forEach((subscription: any) => subscription.remove());
      (this as any)._banSubscriptions = null;
    }
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
