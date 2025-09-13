import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [maxPollingAttempts] = useState(30); // Poll for up to 30 seconds
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [processingCompletion, setProcessingCompletion] = useState(false); // New state for processing phase

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

  // Deep link handling for Stripe onboarding completion
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received in GetStartedPage:', event.url);

      if (event.url.includes('handypay://stripe/callback') ||
          event.url.includes('handypay://stripe/complete') ||
          event.url.includes('handypay://stripe/success')) {
        console.log('✅ Stripe onboarding completion detected');

        // Set processing completion state for better UI
        setProcessingCompletion(true);
        setLoading(true);

        // Start polling for onboarding status
        if (isOnboardingInProgress) {
          startPollingOnboardingStatus();
        } else {
          // If not marked as in progress, check immediately
          checkOnboardingStatus();
        }
      } else if (event.url.includes('handypay://stripe/error')) {
        console.log('❌ Stripe onboarding error detected');
        setIsOnboardingInProgress(false);
        setLoading(false);
        setProcessingCompletion(false); // Clear processing state on error
        Toast.show({
          type: 'error',
          text1: 'Onboarding Failed',
          text2: 'There was an error with your Stripe onboarding. Please try again.'
        });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        console.log('🔗 Initial URL detected:', initialUrl);
        handleDeepLink({ url: initialUrl });
      }
    }).catch((error) => {
      console.error('❌ Error getting initial URL:', error);
    });

    return () => {
      subscription?.remove();
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [user, isOnboardingInProgress]);

  // Polling function for onboarding status
  const startPollingOnboardingStatus = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    console.log('🔄 Starting polling for onboarding status...');
    setPollingAttempts(0);

    const interval = setInterval(async () => {
      setPollingAttempts(prev => {
        const newAttempts = prev + 1;
        console.log(`🔍 Polling attempt ${newAttempts}/${maxPollingAttempts}`);

        if (newAttempts >= maxPollingAttempts) {
          console.log('⏰ Polling timeout reached, stopping...');
          clearInterval(interval);
          setPollingInterval(null);
          setIsOnboardingInProgress(false);
          setLoading(false);
          setProcessingCompletion(false); // Clear processing state on timeout
          setHasIncompleteOnboarding(true); // Mark as incomplete so they can try again
          Toast.show({
            type: 'success',
            text1: 'Still Processing',
            text2: 'Your onboarding is taking longer than expected. Please check back in a few minutes.'
          });
          return newAttempts;
        }

        checkOnboardingStatus();
        return newAttempts;
      });
    }, 1000); // Poll every 1 second

    setPollingInterval(interval);
  };

  // Consolidated status checking
  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      console.log('🔍 Checking onboarding status...');
      const userData = await fetchUserAccount(user.id);

      if (userData.stripe_onboarding_completed) {
        console.log('✅ Onboarding completed, navigating to SuccessPage');

        // Clear polling if active
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        setIsOnboardingInProgress(false);
        setLoading(false);
        setProcessingCompletion(false); // Clear processing state
        setOnboardingCompleted(true); // Mark as completed for UI updates
        navigation.replace('SuccessPage');

        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Onboarding Completed!',
          text2: 'Your account is now ready to accept payments.'
        });

        return true; // Indicate completion
      }

      const accountId = userData.stripe_account_id || userData.stripeAccountId;
      if (accountId) {
        const statusData = await fetchAccountStatus(accountId);
        const chargesEnabled = statusData.accountStatus?.charges_enabled;

        if (chargesEnabled) {
          console.log('✅ Onboarding completed (charges enabled), navigating to SuccessPage');

          // If charges are enabled but backend isn't updated yet, try to force update
          if (!userData.stripe_onboarding_completed) {
            console.log('🔄 Charges enabled but backend not updated - attempting manual update...');
            try {
              console.log('🔄 Calling manual backend update:', {
                url: 'https://handypay-backend.handypay.workers.dev/api/stripe/complete-onboarding',
                userId: user.id,
                stripeAccountId: accountId
              });

              const response = await fetch('https://handypay-backend.handypay.workers.dev/api/stripe/complete-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  stripeAccountId: accountId
                }),
              });

              const result = await response.json();
              console.log('✅ Manual backend update response:', {
                status: response.status,
                result
              });

              if (response.ok && result.success) {
                console.log('🎉 Manual backend update successful');
              } else {
                console.error('❌ Manual backend update failed with result:', result);
              }
            } catch (updateError) {
              console.error('❌ Manual backend update network error:', updateError);
            }
          }

          // Clear polling if active
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }

          setIsOnboardingInProgress(false);
          setLoading(false);
          setOnboardingCompleted(true); // Mark as completed for UI updates
          navigation.replace('SuccessPage');

          // Show success toast
          Toast.show({
            type: 'success',
            text1: 'Onboarding Completed!',
            text2: 'Your account is now ready to accept payments.'
          });

          return true; // Indicate completion
        }
      }

      return false; // Not completed yet
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      return false;
    }
  };

  const cancelOnboarding = () => {
    console.log('🗑️ Cancelling onboarding process...');

    // Clear polling if active
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    setIsOnboardingInProgress(false);
    setLoading(false);
    setProcessingCompletion(false); // Clear processing state
    setHasIncompleteOnboarding(true); // Mark as incomplete so button shows "Continue Onboarding"
    Toast.show({
      type: 'success',
      text1: 'Onboarding Cancelled',
      text2: 'You can continue onboarding anytime by tapping the card above'
    });
  };

  // Handle Stripe onboarding with in-app browser
  const handleStripeOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    // Check if user is banned before proceeding
    try {
      console.log('🔍 Checking ban status before onboarding...');
      const banResponse = await fetch(`https://handypay-backend.handypay.workers.dev/api/users/ban-status/${user.id}`);

      if (banResponse.ok) {
        const banData = await banResponse.json();
        if (banData.isBanned) {
          console.log('🚫 Banned user attempting onboarding:', banData);
          Alert.alert(
            'Account Suspended',
            `Your account has been suspended.\n\nReason: ${banData.banDetails?.reason || 'Violation of terms'}\n\nPlease contact support if you believe this is an error.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error checking ban status:', error);
      // Continue with onboarding if ban check fails (fail open)
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
            type: 'success',
      text1: 'Onboarding Cancelled',
      text2: 'You can continue onboarding anytime by tapping the card above'
          });
          setLoading(false);
          return;
        }

        setIsOnboardingInProgress(true);
        setLoading(false); // Clear loading state since browser is closed
        startPollingOnboardingStatus();
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
      console.log('🎉 Found preloaded Stripe onboarding URL');

      // Validate if the cached URL is still usable
      const isUrlValid = await stripeOnboardingManager.validateCachedUrl();
      if (!isUrlValid) {
        console.log('⚠️ Cached Stripe URL is invalid, clearing cache');
        stripeOnboardingManager.reset();

        // Continue to create new account below
      } else {
        console.log('✅ Using valid cached Stripe onboarding URL');

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
              type: 'success',
              text1: 'Onboarding Cancelled',
              text2: 'You can continue onboarding anytime by tapping the card above'
            });
            setLoading(false);
            return;
          }

          setIsOnboardingInProgress(true);
          setLoading(false); // Clear loading state since browser is closed
          startPollingOnboardingStatus();
        } catch (error) {
          console.error('Error opening Stripe URL:', error);
          Alert.alert('Error', 'Unable to open Stripe onboarding link');
        } finally {
          setLoading(false);
        }
        return;
      }
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
          type: 'success',
      text1: 'Onboarding Cancelled',
      text2: 'You can continue onboarding anytime by tapping the card above'
        });
        setLoading(false);
        return;
      }

      setIsOnboardingInProgress(true);
      setLoading(false); // Clear loading state since browser is closed
      startPollingOnboardingStatus();
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
          (loading || onboardingCompleted || processingCompletion) && styles.disabledCard
        ]}
        onPress={() => {
          if (onboardingCompleted) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
              type: 'success',
              text1: 'Already Completed!',
              text2: 'Your onboarding is complete and ready to accept payments.'
            });
          } else if (!processingCompletion) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleStripeOnboarding();
          }
        }}
        disabled={loading || onboardingCompleted || processingCompletion}
        activeOpacity={(onboardingCompleted || processingCompletion) ? 1 : 0.8}
      >
        <Row
          label="Complete identity verification"
          icon={<UserScanSvg width={24} height={24} />}
          completed={onboardingCompleted || processingCompletion}
        />
        <View style={styles.separator} />
        <Row
          label="Link bank account"
          icon={<BankSvg width={24} height={24} />}
          completed={onboardingCompleted || processingCompletion}
        />

      </TouchableOpacity>

      <View style={styles.badge}>
        <Text style={{ color: '#111827', fontSize: 12, fontWeight: '400', fontFamily: 'DMSans_18pt-Regular' }}>Identify verification securely processed by </Text>
        <View ><StripeSvg width={44} height={24} /></View>
      </View>

      <View style={styles.bottomButtons}>
        <Button
          style={[styles.primaryBtn, (loading || processingCompletion) && styles.disabledButton]}
          onPress={processingCompletion ? undefined : (isOnboardingInProgress ? cancelOnboarding : handleStripeOnboarding)}
          disabled={loading || processingCompletion}
        >
          {(loading || processingCompletion) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>
                {processingCompletion ? "Completing onboarding..." : hasIncompleteOnboarding ? "Continuing onboarding..." : currentStripeAccountId ? "Verifying your account..." : "Starting onboarding..."}
              </Text>
            </View>
          ) : isOnboardingInProgress ? (
            <Text style={styles.primaryBtnText}>
              Cancel Onboarding
            </Text>
          ) : (
            <Text style={styles.primaryBtnText}>
              {onboardingCompleted ? "Onboarding Complete" : hasIncompleteOnboarding ? "Continue Onboarding" : "Get started"}
            </Text>
          )}
        </Button>
        <Button
          variant="secondary"
          style={[styles.secondaryBtn, (loading || processingCompletion) && styles.disabledButton]}
          onPress={() => navigation.replace('HomeTabs')}
          disabled={loading || processingCompletion}
        >
          Skip for now
        </Button>
      </View>
    </View>
  );
}

function Row({ label, icon, completed = false }: { label: string; icon: React.ReactElement; completed?: boolean }): React.ReactElement {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIconCircle, completed && styles.completedIconCircle]}>
        {completed ? (
          <Ionicons name="checkmark" size={20} color="#10B981" />
        ) : (
          icon
        )}
      </View>
      <Text style={[styles.rowLabel, completed && styles.completedRowLabel]}>{label}</Text>
      {completed ? (
        <Ionicons name="checkmark-circle" size={22} color="#10B981" />
      ) : (
        <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
      )}
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
  completedIconCircle: {
    backgroundColor: '#D1FAE5', // Light green background
    borderColor: '#10B981', // Green border
  },
  rowLabel: { flex: 1, marginLeft: 0, fontSize: 16, fontWeight: '500', color: '#111827', fontFamily: 'DMSans-Medium' },
  completedRowLabel: {
    color: '#065F46', // Dark green text
    textDecorationLine: 'line-through',
  },
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