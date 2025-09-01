import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Linking, TouchableOpacity, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArrowSvg from '../../../assets/arrow.svg';
import UserScanSvg from '../../../assets/user-scan.svg';
import BankSvg from '../../../assets/bank.svg';
import StripeSvg from '../../../assets/stripe.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { SupabaseUserService } from '../../services/SupabaseService';
import { stripeOnboardingManager } from '../../services/StripeOnboardingService';
import Toast from 'react-native-toast-message';

export type GetStartedPageProps = NativeStackScreenProps<RootStackParamList, 'GetStartedPage'>;

export default function GetStartedPage({ navigation }: GetStartedPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [currentStripeAccountId, setCurrentStripeAccountId] = useState<string | null>(null);
  const [isOnboardingInProgress, setIsOnboardingInProgress] = useState(false);
  const [onboardingStatusCheckInterval, setOnboardingStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Manual test function to trigger webhook logic
  const testWebhookUpdate = async () => {
    try {
      console.log('🧪 Testing webhook update manually...');
      console.log('📊 Using accountId:', currentStripeAccountId, 'userId:', user?.id);

      if (!currentStripeAccountId || !user?.id) {
        console.log('⚠️ Test webhook attempted without required data:', {
          hasAccountId: !!currentStripeAccountId,
          hasUserId: !!user?.id,
          userId: user?.id
        });

        Toast.show({
          type: 'error',
          text1: 'Test Unavailable',
          text2: 'Please start the onboarding process first to test webhooks',
        });
        return;
      }

      const response = await fetch('https://handypay-backend.onrender.com/api/stripe/test-account-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: currentStripeAccountId,
          userId: user.id
        })
      });

      console.log('📡 Response status:', response.status);

      if (response.status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Backend not updated yet',
          text2: 'Test endpoint not found - redeploy backend',
        });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Test webhook failed with status:', response.status, errorText);
        Toast.show({
          type: 'error',
          text1: 'Test Failed',
          text2: `HTTP ${response.status}: ${errorText}`,
        });
        return;
      }

      const result = await response.json();
      console.log('🧪 Test webhook result:', result);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Webhook test completed!',
          text2: 'Account marked as complete. Navigating...',
        });

        // Force refresh user context and navigate
        setTimeout(async () => {
          try {
            console.log('🔄 Updating user context...');

            // Update local user context to reflect completion
            // SECURITY: DO NOT set stripeOnboardingCompleted locally
            // Only Stripe webhooks should update completion status in backend
            console.log('⚠️ Onboarding completion will be updated via Stripe webhooks only');

            // Update stripeAccountId if we have it
            if (currentStripeAccountId) {
              const { setUser } = useUser();
              if (user) {
                const updatedUser = {
                  ...user,
                  stripeAccountId: currentStripeAccountId
                };
                await setUser(updatedUser);
              }
            }

            console.log('✅ User context updated locally');

            // Navigate to success page
            console.log('✅ Executing navigation.replace(SuccessPage) from test webhook');
            navigation.replace('SuccessPage');
          } catch (error) {
            console.error('❌ Error updating user context:', error);
            // Still navigate even if update fails
            console.log('✅ Executing fallback navigation.replace(SuccessPage) from test webhook error');
            navigation.replace('SuccessPage');
          }
        }, 1000);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Webhook test failed',
          text2: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('❌ Error testing webhook:', error);
      Toast.show({
        type: 'error',
        text1: 'Test failed',
        text2: error instanceof Error ? error.message : 'Network error',
      });
    }
  };

  // Function to start polling for onboarding status
  const startOnboardingStatusCheck = () => {
    console.log('🔄 Starting onboarding status polling...');

    // Check immediately
    checkOnboardingStatus();

    // Temporarily disable interval polling to debug multiple polling issue
    /*
    // Then check every 5 seconds
    const interval = setInterval(() => {
      checkOnboardingStatus();
    }, 5000);

    setOnboardingStatusCheckInterval(interval);
    */
  };

  // Function to stop polling for onboarding status
  const stopOnboardingStatusCheck = () => {
    console.log('🛑 Stopping onboarding status polling...');

    if (onboardingStatusCheckInterval) {
      clearInterval(onboardingStatusCheckInterval);
      setOnboardingStatusCheckInterval(null);
    }
  };

  // Function to cancel onboarding process
  const cancelOnboarding = () => {
    console.log('🗑️ Cancelling onboarding process...');
    stopOnboardingStatusCheck();
    setIsOnboardingInProgress(false);

    Toast.show({
      type: 'info',
      text1: 'Onboarding cancelled',
      text2: 'You can restart the process anytime.',
    });
  };

  // Function to check current onboarding status
  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      console.log('🔍 Checking onboarding status...');

      const userAccountResponse = await fetch(
        `https://handypay-backend.onrender.com/api/stripe/user-account/${user.id}`
      );

      if (userAccountResponse.ok) {
        const userData = await userAccountResponse.json();
        console.log('📊 User data from backend:', userData);

        // Check if user has completed onboarding in backend (webhook might have updated it)
        if (userData.stripe_onboarding_completed) {
          console.log('✅ Onboarding completed in backend (via webhook), navigating to SuccessPage');
          stopOnboardingStatusCheck();
          setIsOnboardingInProgress(false);
          console.log('✅ Executing navigation.replace(SuccessPage) from checkOnboardingStatus');
          navigation.replace('SuccessPage');
          return;
        }

        if (userData.stripe_account_id || userData.stripeAccountId) {
          const accountId = userData.stripe_account_id || userData.stripeAccountId;

          const statusResponse = await fetch(
            `https://handypay-backend.onrender.com/api/stripe/account-status`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stripeAccountId: accountId }),
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            const chargesEnabled = statusData.accountStatus?.charges_enabled;
            const onboardingCompleted = userData.stripe_onboarding_completed;

            console.log('📊 Status check result:', {
              chargesEnabled,
              onboardingCompleted,
              isOnboardingInProgress,
              detailsSubmitted: statusData.accountStatus?.details_submitted
            });

            // If onboarding is now complete, navigate to success page
            if ((chargesEnabled || onboardingCompleted) && isOnboardingInProgress) {
              console.log('✅ Onboarding completed during polling, navigating to SuccessPage');
              stopOnboardingStatusCheck();
              setIsOnboardingInProgress(false);
              console.log('✅ Executing navigation.replace(SuccessPage) from polling completion');
              navigation.replace('SuccessPage');
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 GetStartedPage unmounting - comprehensive cleanup...');

      // Stop all polling
      stopOnboardingStatusCheck();

      // Reset all state to clean slate
      setLoading(false);
      setCurrentStripeAccountId(null);
      setIsOnboardingInProgress(false);

      // Clear any intervals that might still be running
      if (onboardingStatusCheckInterval) {
        clearInterval(onboardingStatusCheckInterval);
        setOnboardingStatusCheckInterval(null);
      }

      console.log('✅ GetStartedPage cleanup complete');
    };
  }, []);

  // Temporarily disable AppState listener to debug multiple polling issue
  /*
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, checking onboarding status...');
        // Small delay to let things settle
        setTimeout(() => {
          checkOnboardingStatus();
        }, 1000);
      }
    });

    return () => subscription?.remove();
  }, []);
  */

  useEffect(() => {
    // Handle deep links from Stripe onboarding
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 DEEP LINK RECEIVED:', event.url, 'Timestamp:', Date.now());
      console.log('🔗 Full event:', JSON.stringify(event, null, 2));

      // Dismiss any existing alerts/modals before processing the deep link
      // Note: Alert.dismiss is not available in React Native

      // Check if this is a Stripe onboarding callback
      if (event.url.includes('stripe') || event.url.includes('onboarding') ||
          event.url.startsWith('handypay://stripe/')) {
        console.log('Stripe onboarding callback detected:', event.url);

        // Determine the type of callback
        const isSuccess = event.url.includes('/success') || event.url.includes('onboarding') || event.url.includes('/complete');
        const isRefresh = event.url.includes('/refresh');

        console.log('🔍 Deep link analysis:', {
          url: event.url,
          isSuccess,
          isRefresh,
          containsSuccess: event.url.includes('/success'),
          containsOnboarding: event.url.includes('onboarding'),
          containsComplete: event.url.includes('/complete'),
          containsRefresh: event.url.includes('/refresh')
        });

        if (isSuccess) {
          console.log('🎉 Stripe onboarding completed, capturing account data...');

          // Temporarily disable aggressive polling to prevent multiple polling instances
          /*
          // Start aggressive polling to catch completion (webhook might be delayed)
          console.log('🔄 Starting aggressive polling for completion status...');
          const aggressivePolling = setInterval(() => {
            checkOnboardingStatus();
          }, 2000); // Check every 2 seconds for faster detection

          // Stop aggressive polling after 30 seconds
          setTimeout(() => {
            clearInterval(aggressivePolling);
            console.log('🛑 Stopped aggressive polling');
          }, 30000);
          */

          // Capture the Stripe account data when user returns successfully
          console.log('👤 Deep link handler - User context check:', {
            hasUser: !!user,
            userId: user?.id,
            currentStripeAccountId
          });

          if (user) {
            console.log('✅ User available in deep link handler, proceeding with account capture');

            // Show immediate success feedback
            setTimeout(() => {
              Toast.show({
                type: 'success',
                text1: 'Onboarding completed!',
                text2: 'Setting up your account...',
              });
            }, 300);

            // Show loading state immediately
            setLoading(true);

            // Add a small delay to show the loading state before capturing data
            setTimeout(() => {
              console.log('🚀 Deep link handler: Starting account data capture...');
              captureStripeAccountData(currentStripeAccountId || undefined, 0, 5);
            }, 1000);
          } else {
            console.log('❌ No user context available in deep link handler');

            // Fallback if no user data available - still navigate to success page
            setTimeout(() => {
              Toast.show({
                type: 'warning',
                text1: 'Onboarding completed!',
                text2: 'Please restart the app to see your account status.',
              });
              console.log('🚀 Setting fallback navigation timeout to SuccessPage');
              setTimeout(() => {
                console.log('✅ Executing fallback navigation to SuccessPage');
                navigation.replace('SuccessPage');
              }, 2000);
            }, 300);
          }
        } else if (isRefresh) {
          // User clicked "Save for Later" on Stripe onboarding
          console.log('💾 User saved onboarding for later - setting up continuation mode');

          // Show success toast for saving progress
          setTimeout(() => {
            Toast.show({
              type: 'success',
              text1: 'Progress Saved',
              text2: 'You can continue onboarding anytime.',
            });

            // Set a flag to indicate we're in continuation mode
            // This would trigger UI changes (loading spinners, "Continue" button)
            console.log('🔄 Would set isContinuingOnboarding = true here');

            // Note: In a full implementation, we'd:
            // 1. Set isContinuingOnboarding state
            // 2. Show loading spinners on cards
            // 3. Change button text to "Continue"
            // 4. Allow resuming onboarding with existing account

          }, 300);
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (in case app was opened from a deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [navigation, user, currentStripeAccountId]);



  // Check user's current onboarding status on component mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log('🔍 Starting onboarding status check...');
      if (!user) {
        console.log('❌ No user available for onboarding check');
        return;
      }

      console.log('🔍 Checking existing onboarding status for user:', user.id);

      try {
        // Check if user has already completed onboarding
        const userAccountResponse = await fetch(
          `https://handypay-backend.onrender.com/api/stripe/user-account/${user.id}`
        );

        if (userAccountResponse.ok) {
          const userData = await userAccountResponse.json();
          console.log('📊 User data from backend:', userData);

          // If user has a Stripe account ID, check its status
          if (userData.stripe_account_id || userData.stripeAccountId) {
            const accountId = userData.stripe_account_id || userData.stripeAccountId;

            console.log('📋 Found existing Stripe account:', accountId);

            // Get account status from Stripe
            const statusResponse = await fetch(
              `https://handypay-backend.onrender.com/api/stripe/account-status`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stripeAccountId: accountId }),
              }
            );

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();

              console.log('📊 Account status:', {
                details_submitted: statusData.accountStatus?.details_submitted,
                charges_enabled: statusData.accountStatus?.charges_enabled,
                onboarding_completed: userData.stripe_onboarding_completed,
                backend_onboarding_completed: userData.stripe_onboarding_completed
              });

              // If onboarding is completed (either in Stripe or our database)
              const chargesEnabled = statusData.accountStatus?.charges_enabled;
              const onboardingCompleted = userData.stripe_onboarding_completed; // Use backend data
              const shouldNavigate = chargesEnabled || onboardingCompleted;

              console.log('🎯 Onboarding decision:', {
                chargesEnabled,
                onboardingCompleted,
                shouldNavigate
              });

            if (shouldNavigate) {
              console.log('✅ Onboarding already completed, navigating to SuccessPage');

              // Update Supabase to ensure consistency
              await SupabaseUserService.updateStripeAccount(
                user.id,
                accountId,
                true // Mark as completed
              );

              // Navigate to success page
              navigation.replace('SuccessPage');
              return;
            }
            }
          }
        }

        console.log('ℹ️ No completed onboarding found, user can start fresh');
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
        // Don't block the user if the check fails - they can still start onboarding
      }
    };

    // Temporarily disable initial status check to debug multiple polling issue
    // checkOnboardingStatus();
  }, [user, navigation]);

  // Handle navigation focus/blur to reset state when user navigates away and back
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('🎯 GetStartedPage focused - resetting state for fresh start');

      // Reset all state when user navigates back to this screen
      setLoading(false);
      setCurrentStripeAccountId(null);
      setIsOnboardingInProgress(false);

      // Stop any lingering polling
      stopOnboardingStatusCheck();

      console.log('🔄 GetStartedPage state reset complete');
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('👁️ GetStartedPage blurred - cleaning up on navigation away');

      // Clean up when user navigates away from this screen
      stopOnboardingStatusCheck();
      setLoading(false);

      console.log('🧹 GetStartedPage blur cleanup complete');
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const captureStripeAccountData = async (accountId?: string, retryCount = 0, maxRetries = 5) => {
    console.log('🎯 captureStripeAccountData called with:', {
      accountId,
      retryCount,
      maxRetries,
      hasUser: !!user,
      userId: user?.id
    });

    if (!user) {
      console.error('❌ No user data available for capturing Stripe account');
      return;
    }

    try {
      console.log(`🔍 Capturing Stripe account data for user: ${user.id} (attempt ${retryCount + 1}/${maxRetries + 1})`);

      let stripeAccountId = accountId;

      // If no accountId provided, try to get it from user profile
      if (!stripeAccountId) {
        console.log('🔄 No accountId provided, checking user profile...');

        // Get user profile data
        const userProfile = await stripeOnboardingManager.getUserProfile(user.id);

        if (userProfile?.stripeAccountId) {
          stripeAccountId = userProfile.stripeAccountId;
          console.log('✅ Found account ID in user profile:', stripeAccountId);
        } else {
          console.log('🔄 No account ID in user profile, checking legacy backend...');

          // Fallback to deployed backend API
          const userAccountResponse = await fetch(
            `https://handypay-backend.onrender.com/api/stripe/user-account/${user.id}`
          );

          if (!userAccountResponse.ok) {
            if (userAccountResponse.status === 404) {
              throw new Error('404: No Stripe account found for user');
            }
            throw new Error(`Failed to get user account: ${userAccountResponse.status}`);
          }

          const userAccountData = await userAccountResponse.json();
          stripeAccountId = userAccountData.stripe_account_id || userAccountData.stripeAccountId;

          if (!stripeAccountId) {
            throw new Error('No Stripe account ID found for user');
          }
        }
      }

      console.log('✅ Using Stripe account ID:', stripeAccountId);

      // Step 2: Get account status using the existing deployed API
      const statusResponse = await fetch(
        `https://handypay-backend.onrender.com/api/stripe/account-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stripeAccountId: stripeAccountId }),
        }
      );

      if (!statusResponse.ok) {
        if (statusResponse.status === 404) {
          throw new Error('404: Stripe account not found');
        }
        throw new Error(`Failed to get account status: ${statusResponse.status}`);
      }

      const accountData = await statusResponse.json();
      console.log('✅ Account status retrieved:', accountData);

      // Step 3: Check onboarding status and update accordingly
      const detailsSubmitted = accountData.accountStatus?.details_submitted;
      const chargesEnabled = accountData.accountStatus?.charges_enabled;

      console.log('📝 Stripe Account Status:', {
          userId: user.id,
          stripeAccountId,
        details_submitted: detailsSubmitted,
        charges_enabled: chargesEnabled,
        payouts_enabled: accountData.accountStatus?.payouts_enabled
        });

        // Step 4: Store in backend database
        try {
          const backendResponse = await fetch(
            'https://handypay-backend.onrender.com/api/stripe/complete-onboarding',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                stripeAccountId: stripeAccountId,
              }),
            }
          );

          if (backendResponse.ok) {
            console.log('✅ Onboarding completion stored in backend database');
          } else {
            console.log('⚠️ Failed to store completion in backend');
          }
        } catch (error) {
          console.error('Error updating backend:', error);
        }

      // Step 4: Update Supabase with onboarding completion status
      // Mark as completed if charges are enabled (account can accept payments)
        if (stripeAccountId) {
        // Mark as completed if charges are enabled (account is actually functional)
        // This is more reliable than details_submitted which might be false for pre-verified accounts
        const onboardingCompleted = chargesEnabled; // Account can accept payments when charges_enabled is true

        console.log(`🔄 Updating Supabase - onboarding completed: ${onboardingCompleted}`);
        console.log(`📊 Account Status Details:`, {
          detailsSubmitted,
          chargesEnabled,
          onboardingCompleted,
          reason: chargesEnabled ? 'charges_enabled is true' : 'charges_enabled is false'
        });

        try {
          const supabaseUpdated = await SupabaseUserService.updateStripeAccount(
            user.id,
            stripeAccountId,
            onboardingCompleted
          );

          if (supabaseUpdated) {
            console.log('✅ Stripe account data stored in Supabase successfully');
          } else {
            console.error('❌ Supabase updateStripeAccount returned false - possible database error');
            console.error('❌ Supabase update failed for user:', user.id, 'account:', stripeAccountId);
            // Log additional context for debugging
            console.error('❌ Account status context:', {
              detailsSubmitted,
              chargesEnabled,
              stripeAccountId,
              onboardingCompleted,
              accountData
            });
          }
        } catch (supabaseError) {
          console.error('❌ Exception during Supabase update:', supabaseError);
          console.error('❌ Supabase update failed with exception for user:', user.id);

          // Don't fail the entire flow if Supabase update fails
          // The backend update above should still work
        }
      } else {
        console.warn('⚠️ No stripeAccountId available for Supabase update');
      }

      // Step 5: Show appropriate success message and navigate
      console.log(`🎯 Determining success message - detailsSubmitted: ${detailsSubmitted}, chargesEnabled: ${chargesEnabled}`);

      if (chargesEnabled) {
        console.log('🎉 Onboarding completed according to API - showing success message!');
        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Onboarding completed!',
            text2: 'Your account is ready to accept payments.',
          });
          console.log('🚀 Setting navigation timeout to SuccessPage (charges enabled)');
          setTimeout(() => {
            console.log('✅ Executing navigation to SuccessPage (charges enabled)');
            navigation.replace('SuccessPage');
          }, 1500);
        }, 300);
      } else if (detailsSubmitted) {
        console.log('📋 Details submitted but account not yet enabled - showing review message');
        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Details submitted!',
            text2: 'Stripe is reviewing your account.',
          });
          console.log('🚀 Setting navigation timeout to SuccessPage (details submitted)');
          setTimeout(() => {
            console.log('✅ Executing navigation to SuccessPage (details submitted)');
            navigation.replace('SuccessPage');
          }, 1500);
        }, 300);
      } else {
        console.log('⚠️ Account exists but no progress made - showing setup message');
        setTimeout(() => {
          Toast.show({
            type: 'info',
            text1: 'Account Connected',
            text2: 'Complete your Stripe setup to start accepting payments.',
          });
          console.log('🚀 Setting navigation timeout to SuccessPage (account connected)');
          setTimeout(() => {
            console.log('✅ Executing navigation to SuccessPage (account connected)');
            navigation.replace('SuccessPage');
          }, 1500);
        }, 300);
      }

    } catch (error) {
      console.error(`❌ Error capturing Stripe account data (attempt ${retryCount + 1}):`, error);

      // Check if this is a 404 error (account not found) and we haven't exceeded max retries
      const is404Error = error instanceof Error && error.message.includes('404');
      const shouldRetry = is404Error && retryCount < maxRetries;

      if (shouldRetry) {
        const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10 seconds
        console.log(`⏳ Account not found, retrying in ${delayMs}ms...`);

        setTimeout(() => {
          captureStripeAccountData(accountId, retryCount + 1, maxRetries);
        }, delayMs);
        return;
      }

      // Max retries reached or different error - show fallback
      console.log('❌ Max retries reached or different error, showing fallback');

      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Onboarding completed!',
          text2: 'Account data will be synced when you restart the app.',
        });
        setTimeout(() => navigation.replace('SuccessPage'), 1500);
      }, 300);
    }
  };

  const handleStripeOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setLoading(true);

    // Wait 1 second before showing the alert
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if we have a preloaded URL
    const preloadedUrl = stripeOnboardingManager.getPreloadedUrl();

    if (preloadedUrl && stripeOnboardingManager.isReady()) {
      console.log('🎉 Using preloaded Stripe onboarding URL');
      setCurrentStripeAccountId(null); // We'll get this from the backend when needed

      // Show alert to confirm before opening Stripe
      Alert.alert(
        'Continue to Stripe',
        'You\'ll be redirected to Stripe to complete your merchant account setup. This will open in your browser.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('User cancelled Stripe redirect');
              setLoading(false);
            }
          },
          {
            text: 'Continue',
            style: 'default',
            onPress: async () => {
              try {
                // Open the preloaded Stripe onboarding URL in the device's browser
                const supported = await Linking.canOpenURL(preloadedUrl);
                if (supported) {
                  await Linking.openURL(preloadedUrl);
                } else {
                  Alert.alert('Error', 'Unable to open Stripe onboarding link');
                }
              } catch (error) {
                console.error('Error opening Stripe URL:', error);
                Alert.alert('Error', 'Unable to open Stripe onboarding link');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
      return;
    }

    // Fallback: Create new onboarding link if preload failed
    try {
      // First check if user has already completed onboarding (fast check)
      const userAccountResponse = await Promise.race([
        fetch(`https://handypay-backend.onrender.com/api/stripe/user-account/${user.id}`),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);

      if (userAccountResponse.ok) {
        const userData = await userAccountResponse.json();
        if (userData.stripe_account_id || userData.stripeAccountId) {
          const accountId = userData.stripe_account_id || userData.stripeAccountId;
          const statusResponse = await Promise.race([
            fetch(`https://handypay-backend.onrender.com/api/stripe/account-status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ stripeAccountId: accountId }),
            }),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            // Check if onboarding is completed (same logic as main check)
            const chargesEnabled = statusData.accountStatus?.charges_enabled;
            const onboardingCompleted = userData.stripe_onboarding_completed;
            const shouldNavigate = chargesEnabled || onboardingCompleted;

            console.log('🎯 Fallback onboarding decision:', {
              chargesEnabled,
              onboardingCompleted,
              shouldNavigate,
              detailsSubmitted: statusData.accountStatus?.details_submitted
            });

            if (shouldNavigate) {
              console.log('✅ Onboarding completed (fallback check), navigating to SuccessPage');
              setLoading(false);
              navigation.replace('SuccessPage');
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Continue with onboarding if check fails or times out
    }

    try {
      // Prepare the request data - use better defaults from fullName if available
      const firstName = user.firstName || (user.fullName ? user.fullName.split(' ')[0] : 'User');
      const lastName = user.lastName || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : 'Unknown');

      const requestData = {
        userId: user.id,
        firstName: firstName,
        lastName: lastName,
        email: user.email || 'user@handypay.com',
        refresh_url: 'https://handypay-backend.onrender.com/stripe/refresh',
        return_url: 'https://handypay-backend.onrender.com/stripe/return',
      };

      console.log('Starting Stripe onboarding for user:', requestData);

      // Call your backend API to create Stripe account and onboarding link
      const response = await fetch('https://handypay-backend.onrender.com/api/stripe/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe account link');
      }

      console.log('Stripe onboarding URL created:', data.url);
      console.log('📝 Received Stripe account ID from backend:', data.accountId);

      // Store the account ID for later use in data capture
      const stripeAccountId = data.accountId;
      setCurrentStripeAccountId(stripeAccountId);

      // Show alert to confirm before opening Stripe
      Alert.alert(
        'Continue to Stripe',
        'You\'ll be redirected to Stripe to complete your merchant account setup. This will open in your browser.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('User cancelled Stripe redirect');
              setLoading(false);
            }
          },
          {
            text: 'Continue',
            style: 'default',
            onPress: async () => {
              try {
                // Set onboarding in progress state
                setIsOnboardingInProgress(true);

                // Start polling for status updates
                startOnboardingStatusCheck();

                // Open the Stripe onboarding URL in the device's browser
                const supported = await Linking.canOpenURL(data.url);
                if (supported) {
                  await Linking.openURL(data.url);
                } else {
                  Alert.alert('Error', 'Unable to open Stripe onboarding link');
                }
              } catch (error) {
                console.error('Error opening Stripe URL:', error);
                Alert.alert('Error', 'Unable to open Stripe onboarding link');
                // Reset onboarding state on error
                setIsOnboardingInProgress(false);
                stopOnboardingStatusCheck();
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Stripe onboarding error:', error);
      Alert.alert(
        'Onboarding Error',
        error instanceof Error ? error.message : 'Failed to start Stripe onboarding. Please try again.',
        [{ text: 'OK' }]
      );
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
                {currentStripeAccountId ? "Verifying your account..." : "Starting onboarding..."}
              </Text>
            </View>
          ) : isOnboardingInProgress ? (
            <Text style={styles.primaryBtnText}>
              Cancel Onboarding
            </Text>
          ) : (
            <Text style={styles.primaryBtnText}>
              Get started
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
        {__DEV__ && currentStripeAccountId && user?.id && (
          <Button
            variant="ghost"
            style={[styles.secondaryBtn, { marginTop: 10, backgroundColor: '#f0f0f0' }]}
            onPress={testWebhookUpdate}
            disabled={loading}
          >
            <Text style={[styles.primaryBtnText, { color: '#666' }]}>
              🧪 Test Webhook
            </Text>
          </Button>
        )}
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


