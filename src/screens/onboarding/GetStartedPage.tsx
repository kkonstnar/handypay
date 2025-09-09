import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import ArrowSvg from '../../../assets/arrow.svg';
import UserScanSvg from '../../../assets/user-scan.svg';
import BankSvg from '../../../assets/bank.svg';
import StripeSvg from '../../../assets/stripe.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { stripeOnboardingManager } from '../../services/StripeOnboardingService';
import Toast from 'react-native-toast-message';

// Helper functions for Stripe onboarding
const fetchUserAccount = async (userId: string) => {
  const response = await fetch(`https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${userId}`);
  if (!response.ok) throw new Error(`Failed to fetch user account: ${response.status}`);
  return response.json();
};

const fetchAccountStatus = async (accountId: string) => {
  const response = await fetch('https://handypay-backend.handypay.workers.dev/api/stripe/account-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stripeAccountId: accountId }),
  });
  if (!response.ok) throw new Error(`Failed to fetch account status: ${response.status}`);
  return response.json();
};

const createStripeAccount = async (userId: string, existingAccountId?: string) => {
  console.log('🚀 Making API call to create Stripe account link');
  console.log('📤 Request payload:', {
    userId,
    stripeAccountId: existingAccountId,
    refresh_url: 'handypay://stripe/callback',
    return_url: 'handypay://stripe/callback'
  });

  const response = await fetch('https://handypay-backend.handypay.workers.dev/api/stripe/create-account-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      stripeAccountId: existingAccountId, // Pass existing account ID to reuse it
      refresh_url: 'handypay://stripe/callback',
      return_url: 'handypay://stripe/callback'
    }),
  });

  console.log('📥 Response status:', response.status);
  console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    console.error('❌ API call failed with status:', response.status);
    const errorText = await response.text();
    console.error('❌ Error response body:', errorText);
    throw new Error(`Failed to create account: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ API call successful, result:', result);
  return result;
};

export type GetStartedPageProps = NativeStackScreenProps<RootStackParamList, 'GetStartedPage'>;

export default function GetStartedPage({ navigation }: GetStartedPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [currentStripeAccountId, setCurrentStripeAccountId] = useState<string | null>(null);
  const [isOnboardingInProgress, setIsOnboardingInProgress] = useState(false);
  const [hasIncompleteOnboarding, setHasIncompleteOnboarding] = useState(false);

  // Check for incomplete onboarding on mount
  useEffect(() => {
    const checkIncompleteOnboarding = async () => {
      if (!user) return;

      try {
        const userData = await fetchUserAccount(user.id);
        const accountId = userData.stripe_account_id || userData.stripeAccountId;

        if (accountId && !userData.stripe_onboarding_completed) {
          console.log('📝 Found incomplete onboarding for user');
          setHasIncompleteOnboarding(true);
          setCurrentStripeAccountId(accountId);
        }
      } catch (error) {
        console.error('❌ Error checking for incomplete onboarding:', error);
      }
    };

    checkIncompleteOnboarding();
  }, [user]);

  // Consolidated status checking
  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      console.log('🔍 Checking onboarding status...');
      const userData = await fetchUserAccount(user.id);

      if (userData.stripe_onboarding_completed) {
        console.log('✅ Onboarding completed, navigating to SuccessPage');
        setIsOnboardingInProgress(false);
        navigation.replace('SuccessPage');
        return;
      }

      const accountId = userData.stripe_account_id || userData.stripeAccountId;
      if (accountId) {
        const statusData = await fetchAccountStatus(accountId);
        const chargesEnabled = statusData.accountStatus?.charges_enabled;

        if ((chargesEnabled || userData.stripe_onboarding_completed) && isOnboardingInProgress) {
          console.log('✅ Onboarding completed during polling, navigating to SuccessPage');
          setIsOnboardingInProgress(false);
          navigation.replace('SuccessPage');
        }
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
    }
  };

  const cancelOnboarding = () => {
    console.log('🗑️ Cancelling onboarding process...');
    setIsOnboardingInProgress(false);
    setHasIncompleteOnboarding(true); // Mark as incomplete so button shows "Continue Onboarding"
    Toast.show({
      type: 'info',
      text1: 'Login cancelled',
      text2: 'You can try again anytime'
    });
  };

  // Handle Stripe onboarding with in-app browser
  const handleStripeOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay

    // First, check if user already has an incomplete onboarding
    if (hasIncompleteOnboarding && currentStripeAccountId) {
      console.log('🔄 Continuing with existing incomplete onboarding:', currentStripeAccountId);

      const shouldContinue = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Continue to Stripe',
          'You\'ll be redirected to Stripe to complete your merchant account setup. This will open in the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Continue',
              style: 'default',
              onPress: () => resolve(true)
            }
          ]
        );
      });

      if (!shouldContinue) {
        setLoading(false);
        return;
      }

      try {
        // Continue with existing account - create a new onboarding link
        console.log('🔄 Creating onboarding link for existing account:', currentStripeAccountId);
        const data = await createStripeAccount(user.id, currentStripeAccountId);
        console.log('✅ Stripe onboarding link created:', data.url);

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'handypay://stripe/callback'
        );
        console.log('🔗 Stripe onboarding browser result:', result);

        if (result.type === 'cancel') {
          console.log('🚫 User cancelled Stripe onboarding in browser');
          setIsOnboardingInProgress(false);
          setHasIncompleteOnboarding(true);
          Toast.show({
            type: 'info',
            text1: 'Login cancelled',
            text2: 'You can try again anytime'
          });
          setLoading(false);
          return;
        }

        setIsOnboardingInProgress(true);
        checkOnboardingStatus();
      } catch (error) {
        console.error('Error continuing Stripe onboarding:', error);
        Alert.alert('Error', 'Unable to continue Stripe onboarding');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Try preloaded URL second (for new users)
    const preloadedUrl = stripeOnboardingManager.getPreloadedUrl();
    if (preloadedUrl && stripeOnboardingManager.isReady()) {
      console.log('🎉 Using preloaded Stripe onboarding URL');

      const shouldContinue = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Continue to Stripe',
          'You\'ll be redirected to Stripe to complete your merchant account setup. This will open in the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Continue',
              style: 'default',
              onPress: () => resolve(true)
            }
          ]
        );
      });

      if (!shouldContinue) {
        setLoading(false);
        return;
      }

      try {
        const result = await WebBrowser.openAuthSessionAsync(
          preloadedUrl,
          'handypay://stripe/callback'
        );
        console.log('🔗 Stripe onboarding browser result:', result);

        if (result.type === 'cancel') {
          console.log('🚫 User cancelled Stripe onboarding in browser');
          setIsOnboardingInProgress(false);
          setHasIncompleteOnboarding(true);
          Toast.show({
            type: 'info',
            text1: 'Login cancelled',
            text2: 'You can try again anytime'
          });
          setLoading(false);
          return;
        }

        setIsOnboardingInProgress(true);
        checkOnboardingStatus();
      } catch (error) {
        console.error('Error opening Stripe URL:', error);
        Alert.alert('Error', 'Unable to open Stripe onboarding link');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Finally, create new Stripe account for brand new users
    try {
      console.log('🔄 Creating new Stripe account for new user...');
      const data = await createStripeAccount(user.id);
      console.log('✅ Stripe account created:', data.url);

      setCurrentStripeAccountId(data.accountId);

      const shouldContinue = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Continue to Stripe',
          'You\'ll be redirected to Stripe to complete your merchant account setup. This will open in the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Continue',
              style: 'default',
              onPress: () => resolve(true)
            }
          ]
        );
      });

      if (!shouldContinue) {
        setLoading(false);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'handypay://stripe/callback'
      );
      console.log('🔗 Stripe onboarding browser result:', result);

      if (result.type === 'cancel') {
        console.log('🚫 User cancelled Stripe onboarding in browser');
        setIsOnboardingInProgress(false);
        setHasIncompleteOnboarding(true);
        Toast.show({
          type: 'info',
          text1: 'Login cancelled',
          text2: 'You can try again anytime'
        });
        setLoading(false);
        return;
      }

      setIsOnboardingInProgress(true);
      checkOnboardingStatus();
    } catch (error) {
      console.error('Stripe onboarding error:', error);
      Alert.alert(
        'Onboarding Error',
        error instanceof Error ? error.message : 'Failed to start Stripe onboarding. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingHorizontal: 24 }]}>
      <Button variant="ghost" size="icon" onPress={() => navigation.goBack()} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
        <ArrowSvg width={24} height={24} />
        {''}
      </Button>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.title}>Get started</Text>
        <Text style={styles.subtitle}>You're a few taps away from accepting payments.</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.card,
          loading && styles.disabledCard
        ]}
        onPress={handleStripeOnboarding}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Row
          label="Complete Identify verification"
          icon={<UserScanSvg width={24} height={24} />}
        />
        <View style={styles.separator} />
        <Row
          label="Link bank account"
          icon={<BankSvg width={24} height={24} />}
        />

      </TouchableOpacity>

      <View style={styles.badge}>
        <Text style={{ color: '#111827', fontSize: 12, fontWeight: '400', fontFamily: 'DMSans_18pt-Regular' }}>Identify verification securely processed by </Text>
        <View ><StripeSvg width={44} height={24} /></View>
      </View>

      <View style={styles.bottomButtons}>
        <Button
          style={[styles.primaryBtn, loading && styles.disabledButton]}
          onPress={isOnboardingInProgress ? cancelOnboarding : handleStripeOnboarding}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>
                {hasIncompleteOnboarding ? "Continuing onboarding..." : currentStripeAccountId ? "Verifying your account..." : "Starting onboarding..."}
              </Text>
            </View>
          ) : isOnboardingInProgress ? (
            <Text style={styles.primaryBtnText}>
              Cancel Onboarding
            </Text>
          ) : (
            <Text style={styles.primaryBtnText}>
              {hasIncompleteOnboarding ? "Continue Onboarding" : "Get started"}
            </Text>
          )}
        </Button>
        <Button
          variant="secondary"
          style={[styles.secondaryBtn, loading && styles.disabledButton]}
          onPress={() => navigation.replace('HomeTabs')}
          disabled={loading}
        >
          Skip for now
        </Button>
      </View>
    </View>
  );
}

function Row({ label, icon }: { label: string; icon: React.ReactElement }): React.ReactElement {
  return (
    <View style={styles.row}>
      <View style={styles.rowIconCircle}>
        {icon}
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  title: { fontSize: 40, fontWeight: '800', color: '#111827', lineHeight: 44, fontFamily: 'Coolvetica' },
  subtitle: { marginTop: 12, color: '#374151', fontSize: 18, lineHeight: 26, fontFamily: 'DMSans-Medium' },
  card: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#ffffff',
  },

  disabledCard: {
    opacity: 0.6,
  },

  row: {
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowRadius: 2,
    elevation: 2,
  },
  rowLabel: { flex: 1, marginLeft: 0, fontSize: 16, fontWeight: '500', color: '#111827', fontFamily: 'DMSans-Medium' },
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  badge: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stripePill: { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bottomButtons: { position: 'absolute', left: 24, right: 24, bottom: 56 },
  primaryBtn: { height: 48, borderRadius: 24, backgroundColor: '#3AB75C', borderColor: '#3AB75C' },
  primaryBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '600', fontFamily: 'DMSans-Medium' },
  secondaryBtn: { height: 48, borderRadius: 24, backgroundColor: '#f3f4f6',  marginTop: 12 },
  secondaryBtnText: { color: '#111827', fontSize: 18, fontWeight: '600', fontFamily: 'DMSans-Medium' },
  disabledButton: { opacity: 0.6 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
});