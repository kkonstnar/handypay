import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootNavigator";

interface UseOnboardingCheckProps {
  userId?: string;
  navigation: NavigationProp<RootStackParamList>;
}

export const useOnboardingCheck = ({
  userId,
  navigation,
}: UseOnboardingCheckProps) => {
  const [onboardingVerified, setOnboardingVerified] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!userId) return;

      try {
        console.log("🔐 Checking backend onboarding status...");

        const response = await fetch(
          `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${userId}`
        );

        if (response.ok) {
          const backendData = await response.json();
          console.log("📊 Backend onboarding status:", {
            hasAccount: !!backendData.stripe_account_id,
            onboardingCompleted: backendData.stripe_onboarding_completed,
          });

          if (!backendData.stripe_account_id) {
            console.log("❌ No Stripe account found in backend");
            Alert.alert(
              "Complete Setup First",
              "You need to finish your Stripe onboarding before you can generate QR codes for payments.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => navigation.goBack(),
                },
                {
                  text: "Continue Setup",
                  onPress: () => {
                    navigation.replace("GetStartedPage");
                  },
                },
              ]
            );
            return;
          }

          if (!backendData.stripe_onboarding_completed) {
            console.log("❌ Onboarding not completed according to backend");
            Alert.alert(
              "Complete Setup First",
              "You need to finish your Stripe onboarding before you can generate QR codes for payments.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => navigation.goBack(),
                },
                {
                  text: "Continue Setup",
                  onPress: () => {
                    navigation.replace("GetStartedPage");
                  },
                },
              ]
            );
            return;
          }

          // Onboarding is complete, proceed with QR generation
          console.log("✅ Onboarding verified, proceeding...");
          setOnboardingVerified(true);
        } else {
          console.error("❌ Failed to check backend status:", response.status);
          Alert.alert(
            "Error",
            "Unable to verify account status. Please try again."
          );
          navigation.goBack();
        }
      } catch (error) {
        console.error("❌ Error checking backend status:", error);
        Alert.alert(
          "Error",
          "Unable to verify account status. Please try again."
        );
        navigation.goBack();
      }
    };

    checkOnboardingStatus();
  }, [userId, navigation]);

  return { onboardingVerified };
};
