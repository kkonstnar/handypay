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

interface AccountStatus {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: any;
}

export default function SuccessPage({ navigation, route }: SuccessPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false); // Start as false since we have the data
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);

  useEffect(() => {
    // Check if account status was passed from GetStartedPage
    const passedAccountStatus = (route.params as any)?.accountStatus as AccountStatus;

    if (passedAccountStatus) {
      console.log('📊 Using passed account status from GetStartedPage:', passedAccountStatus);
      setAccountStatus(passedAccountStatus);
      setIsCheckingStatus(false);
    } else {
      // Fallback: Check status if not passed (shouldn't happen in normal flow)
      console.log('⚠️ No account status passed, falling back to API check');
      setIsCheckingStatus(true);
      checkStripeAccountStatus();
    }
  }, [route.params]);

  const checkStripeAccountStatus = async () => {
    if (!user?.id) {
      setIsCheckingStatus(false);
      return;
    }

    try {
      console.log(`🔍 Checking Stripe account status for user: ${user.id}`);

      // Single comprehensive API call to get both account data and status
      const backendResponse = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${user.id}`
      );

      if (!backendResponse.ok) {
        console.log('❌ Failed to fetch user account data');
        setIsCheckingStatus(false);
        return;
      }

      const backendData = await backendResponse.json();
      console.log('📊 Backend data:', backendData);

      if (backendData.stripe_account_id && backendData.stripe_onboarding_completed) {
        console.log('✅ Found completed onboarding in backend:', backendData.stripe_account_id);

        // Get comprehensive account status in one call
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
            charges_enabled: statusData.accountStatus?.charges_enabled ?? true,
            payouts_enabled: statusData.accountStatus?.payouts_enabled ?? true,
            details_submitted: statusData.accountStatus?.details_submitted ?? true,
            requirements: statusData.accountStatus?.requirements,
          });
        } else {
          // Set success state even if status check fails
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

      // If not completed, still show the account info if available
      if (backendData.stripe_account_id) {
        console.log('📋 Found incomplete onboarding account:', backendData.stripe_account_id);

        // Get status even for incomplete accounts
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
          setAccountStatus({
            id: backendData.stripe_account_id,
            charges_enabled: statusData.accountStatus?.charges_enabled ?? false,
            payouts_enabled: statusData.accountStatus?.payouts_enabled ?? false,
            details_submitted: statusData.accountStatus?.details_submitted ?? false,
            requirements: statusData.accountStatus?.requirements,
          });
        }
      }

      setIsCheckingStatus(false);
    } catch (error) {
      console.error('❌ Error checking Stripe account status:', error);
      setIsCheckingStatus(false);
    }
  };

  const handleCompleteOnboarding = () => {
    console.log('Onboarding process completed by user, navigating to HomeTabs');
    console.log('⚠️ Note: Onboarding completion status will be updated via Stripe webhooks only');

    // DO NOT update stripeOnboardingCompleted locally - this is a SECURITY RISK
    // Only Stripe webhooks should update the completion status in the backend
    // The frontend should always check the backend for the real status

    // Reset navigation stack to prevent going back to legal pages
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeTabs' }],
    });
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
    paddingBottom: 24
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
