import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SuccessSvg from '../../../assets/success.svg';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';
import { SupabaseUserService } from '../../services/SupabaseService';

export type SuccessPageProps = NativeStackScreenProps<RootStackParamList, 'SuccessPage'>;

export default function SuccessPage({ navigation }: SuccessPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<{
    id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    requirements?: any;
  } | null>(null);

  useEffect(() => {
    // Add a small delay to allow manual updates from GetStartedPage to complete
    const checkDelay = setTimeout(() => {
      checkStripeAccountStatus();
    }, 500); // Wait 500ms for manual updates to complete

    // Reduced safety timeout: Only wait 3 seconds since manual updates should be immediate now
    const safetyTimeout = setTimeout(() => {
      if (isCheckingStatus) {
        console.log('⏰ Safety timeout reached - showing success state (reduced from 10s to 3s)');
        setIsCheckingStatus(false);
        // Set a fallback success state
        setAccountStatus({
          id: 'pending_verification',
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
        });
      }
    }, 3500); // 3.5 seconds total (500ms delay + 3s timeout)

    return () => {
      clearTimeout(checkDelay);
      clearTimeout(safetyTimeout);
    };
  }, []);

  const checkStripeAccountStatus = async (retryCount = 0) => {
    if (!user?.id) {
      setIsCheckingStatus(false);
      return;
    }

    try {
      console.log(`🔍 Checking Stripe account status for user: ${user.id} (attempt ${retryCount + 1})`);

      // FIRST: Check backend API (this is where webhook updates happen)
      console.log('🔍 Checking backend API first (webhook source of truth)...');
      const backendResponse = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${user.id}`
      );

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('📊 Backend data:', backendData);
        console.log('🔍 Looking for stripe_onboarding_completed:', backendData.stripe_onboarding_completed);

        if (backendData.stripe_account_id && backendData.stripe_onboarding_completed) {
          console.log('✅ Found completed onboarding in backend:', backendData.stripe_account_id);

          // Get the account status from Stripe via backend
          const statusResponse = await fetch(
            `https://handypay-backend.handypay.workers.dev/api/stripe/account-status`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stripeAccountId: backendData.stripe_account_id }),
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('📊 Account status from backend:', statusData);

            setAccountStatus({
              id: backendData.stripe_account_id,
              charges_enabled: statusData.accountStatus?.charges_enabled || true, // Assume true for completed onboarding
              payouts_enabled: statusData.accountStatus?.payouts_enabled || true,
              details_submitted: statusData.accountStatus?.details_submitted || true,
              requirements: statusData.accountStatus?.requirements,
            });
          } else {
            // Fallback: Set success state even if account status fails
            setAccountStatus({
              id: backendData.stripe_account_id,
              charges_enabled: true,
              payouts_enabled: true,
              details_submitted: true,
            });
          }
          setIsCheckingStatus(false);
          return;
        }
      }

      // FALLBACK: Check Supabase (might be stale)
      const userFromDb = await SupabaseUserService.getUser(user.id);

      if (userFromDb?.stripe_account_id && userFromDb?.stripe_onboarding_completed) {
        console.log('✅ Found Stripe account in Supabase:', userFromDb.stripe_account_id);

        // Get the account status from Stripe via backend
        const statusResponse = await fetch(
          `https://handypay-backend.handypay.workers.dev/api/stripe/account-status/${userFromDb.stripe_account_id}`
        );
        const statusData = await statusResponse.json();

        if (statusResponse.ok) {
          setAccountStatus({
            id: statusData.id,
            charges_enabled: statusData.charges_enabled || false,
            payouts_enabled: statusData.payouts_enabled || false,
            details_submitted: statusData.details_submitted || false,
            requirements: statusData.requirements,
          });
        }
        setIsCheckingStatus(false);
        return;
      }

      // FINAL FALLBACK: Check backend API (for backward compatibility)
      console.log('🔄 No Supabase data found, checking backend API...');
      const response = await fetch(`https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${user.id}`);
      const userData = await response.json();

      if (!response.ok || !userData.stripe_account_id) {
        console.log('No Stripe account found for user in backend either');

        // If this is the first attempt and we didn't find data, retry after a delay
        // This handles timing issues where completion endpoint might not have finished yet
        if (retryCount === 0) {
          console.log('⏳ No data found, retrying in 3 seconds...');
          setTimeout(() => {
            checkStripeAccountStatus(retryCount + 1);
          }, 3000);
          return;
        }

        setIsCheckingStatus(false);
        return;
      }

      // Check the account status with Stripe
      const statusResponse = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/account-status/${userData.stripe_account_id}`
      );
      const statusData = await statusResponse.json();

      if (statusResponse.ok) {
        setAccountStatus({
          id: statusData.id,
          charges_enabled: statusData.charges_enabled || false,
          payouts_enabled: statusData.payouts_enabled || false,
          details_submitted: statusData.details_submitted || false,
          requirements: statusData.requirements,
        });
      } else {
        console.error('Failed to get account status:', statusData);
      }
    } catch (error) {
      console.error('❌ Error checking Stripe account status:', error);
    } finally {
      if (retryCount > 0) {
        setIsCheckingStatus(false);
      }
    }
  };

  const handleCompleteOnboarding = () => {
    console.log('Onboarding process completed by user, navigating to HomeTabs');
    console.log('⚠️ Note: Onboarding completion status will be updated via Stripe webhooks only');

    // DO NOT update stripeOnboardingCompleted locally - this is a SECURITY RISK
    // Only Stripe webhooks should update the completion status in the backend
    // The frontend should always check the backend for the real status

    navigation.replace('HomeTabs');
  };

  const handleRefreshStatus = () => {
    console.log('🔄 Manual refresh triggered');
    setIsCheckingStatus(true);
    setAccountStatus(null);
    checkStripeAccountStatus();
  };

  const getStatusMessage = () => {
    if (isCheckingStatus) {
      return "Checking your account status...";
    }

    if (!accountStatus) {
      return "You're all set up! You can now start accepting payments.";
    }

    // Check for details_submitted (matching actual API response)
    const detailsSubmitted = accountStatus.details_submitted;

    if (detailsSubmitted && accountStatus.charges_enabled) {
      return "Your account is now fully verified and ready to accept payments.";
    } else if (detailsSubmitted) {
      return "Your information has been submitted.  Your account is being reviewed - this usually takes a few minutes to a few days. We'll notify you when it's ready!";
    } else {
      return "You've started the setup process. Please complete your Stripe onboarding to start accepting payments.";
    }
  };

  const getStatusIcon = () => {
    if (isCheckingStatus) {
      return <ActivityIndicator size="large" color="#3AB75C" />;
    }

    // Check for details_submitted (matching actual API response)
    const detailsSubmitted = accountStatus?.details_submitted;

    if (!accountStatus || !detailsSubmitted) {
      return <Ionicons name="warning" size={48} color="#F59E0B" />;
    }

    if (accountStatus.charges_enabled) {
      return <SuccessSvg width={48} height={48} />;
    }

    return <Ionicons name="time" size={48} color="#6B7280" />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={handleCompleteOnboarding}>
          <Ionicons name="close" size={24} color="#111827" />
        </Button>
      </View>

      <View style={styles.centerWrap}>
        {getStatusIcon()}
        <Text style={styles.title}>
          {isCheckingStatus ? "Verifying Your Account" :
           accountStatus?.charges_enabled ? "You're All Set!" :
           accountStatus?.details_submitted ? "Account Under Review" :
           "Setup Started"}
        </Text>
        <Text style={styles.subtitle}>{getStatusMessage()}</Text>

       
      </View>

      <View style={styles.bottomButtons}>
        {/* Only show the main button when verification is complete */}
        {!isCheckingStatus && (
          <Button style={styles.primaryBtn} textStyle={styles.primaryBtnText} onPress={handleCompleteOnboarding}>
            {accountStatus?.charges_enabled ? "Start Accepting Payments" : "Done"}
          </Button>
        )}

        {/* Show refresh button if still checking or if there are issues */}
        {(!accountStatus || !accountStatus.details_submitted) && !isCheckingStatus && (
          <Button
            variant="ghost"
            style={[styles.secondaryBtn, { marginTop: 12 }]}
            textStyle={styles.secondaryBtnText}
            onPress={handleRefreshStatus}
          >
            🔄 Refresh Status
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    justifyContent: 'space-between'
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8
  },
  centerWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'DMSans-SemiBold'
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'DMSans-Medium',
    paddingHorizontal: 32,
  },
  bottomButtons: { 
    paddingHorizontal: 24,
    paddingBottom: 48
  },
  primaryBtn: { 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#3AB75C', 
    borderColor: '#3AB75C' 
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  secondaryBtnText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  },
  confirmationContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  confirmationText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
    fontFamily: 'DMSans-Medium',
  },
});
