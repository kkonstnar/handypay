import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";

export const showBanNotification = (banDetails: any) => {
  console.log("🚫 Showing ban notification:", banDetails);

  // Strong haptic feedback for ban notification
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

  // Show persistent toast notification
  Toast.show({
    type: "error",
    text1: "Account Restricted",
    text2:
      banDetails?.reason ||
      "Your account has been restricted. Please contact support.",
    autoHide: false, // Don't auto-hide - user needs to see this
    onPress: () => {
      // Could navigate to support/contact page
      console.log("📞 User tapped ban notification");
    },
    props: {
      banDetails,
    },
  });
};

export const showUnbanNotification = () => {
  console.log("✅ Showing unban notification");

  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  Toast.show({
    type: "success",
    text1: "Account Restored",
    text2: "Your account restrictions have been lifted.",
    autoHide: true,
    visibilityTime: 4000,
  });
};
