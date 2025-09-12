import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../contexts/UserContext';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import StartPage from '../screens/onboarding/StartPage';
import BiometricsPage from '../screens/onboarding/BiometricsPage';
import NotificationsPage from '../screens/onboarding/NotificationsPage';
import PrivacyPage from '../screens/onboarding/PrivacyPage';
import FeaturesPage from '../screens/onboarding/FeaturesPage';
import LegalPage from '../screens/onboarding/LegalPage';
import TermsContentPage from '../screens/onboarding/TermsContentPage';
import GetStartedPage from '../screens/onboarding/GetStartedPage';
import SuccessPage from '../screens/onboarding/SuccessPage';
import PaymentApproved from '../screens/payment/PaymentApproved';
import PaymentError from '../screens/payment/PaymentError';
import ShareReceipt from '../screens/payment/ShareReceipt';
import ScanToPayScreen from '../screens/payment/ScanToPayScreen';

import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import HomeTabs from './HomeTabs';

export type RootStackParamList = {
  Onboarding: undefined;
  StartPage: undefined;
  BiometricsPage: undefined;
  NotificationsPage: undefined;
  PrivacyPage: undefined;
  FeaturesPage: undefined;
  LegalPage: undefined;
  TermsContentPage: undefined;
  GetStartedPage: undefined;
  SuccessPage: undefined;
  PaymentApproved: { amount?: number; currency?: string };
  PaymentError: { amount?: number; currency?: string };
  ShareReceipt: { amount?: number; currency?: string };
  ScanToPay: { amount: number; currency: string; paymentLink?: string };

  TransactionDetails: { transactionId: string };
  HomeTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Component to handle initial routing based on authentication status
function AuthRouter(): React.ReactElement {
  const { user, isLoading } = useUser();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<{
    hasAccount: boolean;
    isComplete: boolean;
  } | null>(null);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<number | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("StartPage");

  // Check backend onboarding status when user is available
  useEffect(() => {
    const checkBackendOnboardingStatus = async () => {
      if (!user?.id) {
        setOnboardingStatus(null);
        return;
      }

      // Check if we recently checked this user's status (within last 30 seconds)
      const now = Date.now();
      if (lastCheckedUserId === user.id && lastCheckedTime && (now - lastCheckedTime) < 30000) {
        if (__DEV__) {
          console.log('⏰ Using cached onboarding status for user:', user.id);
        }
        return;
      }

      setCheckingOnboarding(true);

      // Add shorter timeout for faster login experience
      const timeoutId = setTimeout(() => {
        // Only log timeout in development mode
        if (__DEV__) {
          console.log('⏰ Backend check timed out - falling back to local data');
        }
        setCheckingOnboarding(false);
        setOnboardingStatus(null);
        // Update initial route after timeout
        updateInitialRoute(user, null);
      }, 2000); // 2 second timeout for faster login

      try {
        // Only log in development mode to reduce console spam
        if (__DEV__) {
          console.log('🔍 Checking backend onboarding status for user:', user.id);
        }

        const response = await fetch(
          `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${user.id}`
        );

        clearTimeout(timeoutId); // Clear timeout if request succeeds

        if (response.ok) {
          const backendData = await response.json();
          const status = {
            hasAccount: !!backendData.stripe_account_id,
            isComplete: !!backendData.stripe_onboarding_completed
          };
          setOnboardingStatus(status);

          // Update cache
          setLastCheckedUserId(user.id);
          setLastCheckedTime(Date.now());

          // Only log in development mode to reduce console spam
          if (__DEV__) {
            console.log('✅ Backend onboarding status:', status);
          }

          // Update initial route
          updateInitialRoute(user, status);
        } else {
          // Only log failures in development mode
          if (__DEV__) {
            console.log('❌ Failed to check backend onboarding status - falling back to local data');
          }
          setOnboardingStatus(null);
          // Update initial route
          updateInitialRoute(user, null);
        }
      } catch (error) {
        // Only log errors in development mode
        if (__DEV__) {
          console.error('❌ Error checking backend onboarding status - falling back to local data:', error);
        }
        setOnboardingStatus(null);
        // Update initial route
        updateInitialRoute(user, null);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (user?.id) {
      // Add a small delay to ensure user context is fully loaded
      setTimeout(() => {
        checkBackendOnboardingStatus();
      }, 100);
    }
  }, [user?.id]);

  // Update initial route when auth check completes
  const updateInitialRoute = (user: any, onboardingStatus: any) => {
    let routeName: keyof RootStackParamList = "StartPage";

    if (user) {
      // User is logged in, check if they've completed Stripe onboarding
      // Use backend status if available, otherwise fall back to local user context
      const onboardingCompleted = onboardingStatus?.isComplete ?? user.stripeOnboardingCompleted;
      const hasStripeAccount = onboardingStatus?.hasAccount ?? !!user.stripeAccountId;

      // Only log navigation decisions in development mode
      if (__DEV__) {
        console.log('🎯 Navigation decision:', {
          userId: user.id,
          hasStripeAccount,
          onboardingCompleted
        });
      }

      if (onboardingCompleted && hasStripeAccount) {
        // User has completed onboarding, go to main app
        if (__DEV__) {
          console.log('🚀 User has completed onboarding - setting initial route to HomeTabs');
        }
        routeName = "HomeTabs";
      } else if (hasStripeAccount) {
        // User has Stripe account but onboarding not complete, go to GetStartedPage
        if (__DEV__) {
          console.log('🔄 User has Stripe account but onboarding incomplete - setting initial route to GetStartedPage');
        }
        routeName = "GetStartedPage";
      } else {
        // User has no Stripe account, start from biometrics
        if (__DEV__) {
          console.log('👤 User has no Stripe account - setting initial route to BiometricsPage');
        }
        routeName = "BiometricsPage";
      }
    }

    setInitialRoute(routeName);
  };

  // Handle navigation for non-authenticated users
  useEffect(() => {
    if (!isLoading && !user && !checkingOnboarding) {
      setInitialRoute("StartPage");
    }
  }, [isLoading, user, checkingOnboarding]);

  // Remove white screen loading - let individual pages handle their own loading states

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="StartPage" component={StartPage} />
      <Stack.Screen name="BiometricsPage" component={BiometricsPage} />
      <Stack.Screen name="NotificationsPage" component={NotificationsPage} />
      <Stack.Screen name="PrivacyPage" component={PrivacyPage} />
      <Stack.Screen name="FeaturesPage" component={FeaturesPage} />
      <Stack.Screen name="LegalPage" component={LegalPage} />
      <Stack.Screen name="TermsContentPage" component={TermsContentPage} />
      <Stack.Screen name="GetStartedPage" component={GetStartedPage} />
      <Stack.Screen name="SuccessPage" component={SuccessPage} />
      <Stack.Screen name="PaymentApproved" component={PaymentApproved} />
      <Stack.Screen name="PaymentError" component={PaymentError} />
      <Stack.Screen name="ShareReceipt" component={ShareReceipt} />
      <Stack.Screen name="ScanToPay" component={ScanToPayScreen} />

      <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
    </Stack.Navigator>
  );
}

export default function RootNavigator(): React.ReactElement {
  return <AuthRouter />;
}
