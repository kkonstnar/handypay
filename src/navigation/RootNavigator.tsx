import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../contexts/UserContext';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import StartPage from '../screens/onboarding/StartPage';
import BiometricsPage from '../screens/onboarding/BiometricsPage';
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

  // Check backend onboarding status when user is available
  useEffect(() => {
    const checkBackendOnboardingStatus = async () => {
      if (!user?.id) {
        setOnboardingStatus(null);
        return;
      }

      setCheckingOnboarding(true);
      try {
        console.log('🔍 RootNavigator - Checking backend onboarding status for user:', {
          userId: user.id,
          hasStripeAccountId: !!user.stripeAccountId,
          stripeAccountId: user.stripeAccountId
        });
        const response = await fetch(
          `https://handypay-backend.onrender.com/api/stripe/user-account/${user.id}`
        );

        if (response.ok) {
          const backendData = await response.json();
          setOnboardingStatus({
            hasAccount: !!backendData.stripe_account_id,
            isComplete: !!backendData.stripe_onboarding_completed
          });
          console.log('✅ Backend onboarding status:', {
            hasAccount: !!backendData.stripe_account_id,
            isComplete: !!backendData.stripe_onboarding_completed,
            backendData: backendData
          });
        } else {
          console.log('❌ Failed to check backend onboarding status');
          setOnboardingStatus(null);
        }
      } catch (error) {
        console.error('❌ Error checking backend onboarding status:', error);
        setOnboardingStatus(null);
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

  // Show loading spinner while checking authentication or onboarding status
  // Also wait for onboarding status to be available if user exists
  if (isLoading || checkingOnboarding || (user && !onboardingStatus)) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff'
      }}>
        <ActivityIndicator size="large" color="#3AB75C" />
      </View>
    );
  }

  // Determine initial route based on user authentication and onboarding status
  let initialRoute: keyof RootStackParamList = "StartPage";

  if (user) {
    // User is logged in, check if they've completed Stripe onboarding
    // Use backend status if available, otherwise fall back to local user context
    const onboardingCompleted = onboardingStatus?.isComplete ?? user.stripeOnboardingCompleted;
    const hasStripeAccount = onboardingStatus?.hasAccount ?? !!user.stripeAccountId;

    console.log('🎯 RootNavigator navigation decision:', {
      userId: user.id,
      hasStripeAccount,
      onboardingCompleted,
      onboardingStatus,
      userStripeAccountId: user.stripeAccountId,
      userOnboardingCompleted: user.stripeOnboardingCompleted
    });

    if (onboardingCompleted && hasStripeAccount) {
      // User has completed onboarding, go to main app
      console.log('🚀 User has completed onboarding - navigating to HomeTabs');
      initialRoute = "HomeTabs";
    } else if (hasStripeAccount) {
      // User has Stripe account but onboarding not complete, go to GetStartedPage
      console.log('🔄 User has Stripe account but onboarding incomplete - navigating to GetStartedPage');
      initialRoute = "GetStartedPage";
    } else {
      // User has no Stripe account, start from biometrics
      console.log('👤 User has no Stripe account - navigating to BiometricsPage');
      initialRoute = "BiometricsPage";
    }
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="StartPage" component={StartPage} />
      <Stack.Screen name="BiometricsPage" component={BiometricsPage} />
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
