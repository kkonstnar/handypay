import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Toast from 'react-native-toast-message';
import { useUser } from '../../contexts/UserContext';

// Custom hooks
import { useOnboardingCheck } from '../../hooks/useOnboardingCheck';
import { useQRGeneration } from '../../hooks/useQRGeneration';
import { usePaymentPolling, PaymentStatus } from '../../hooks/usePaymentPolling';
import { useRefreshAnimation } from '../../hooks/useRefreshAnimation';

// Components
import { Header } from '../../components/scanToPay/Header';
import { AmountDisplay } from '../../components/scanToPay/AmountDisplay';
import { QRCodeSection } from '../../components/scanToPay/QRCodeSection';
import { InstructionsSection } from '../../components/scanToPay/InstructionsSection';
import { BottomActions } from '../../components/scanToPay/BottomActions';

// Utils
import { generateShareMessage, formatDisplayAmount, PAYMENT_CONSTANTS } from '../../utils/paymentUtils';

export type ScanToPayScreenProps = NativeStackScreenProps<RootStackParamList, 'ScanToPay'>;

export default function ScanToPayScreen({ navigation, route }: ScanToPayScreenProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { amount, currency, paymentLink: initialPaymentLink } = route.params;
  const { user } = useUser();

  // State
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');

  // Refs
  const qrCodeRef = useRef<View>(null);

  // Custom hooks
  const { onboardingVerified } = useOnboardingCheck({ 
    userId: user?.id, 
    navigation 
  });

  const qrGeneration = useQRGeneration({
    amount,
    currency,
    initialPaymentLink,
    userId: user?.id,
    userFullName: user?.fullName || undefined,
    userEmail: user?.email || undefined,
  });

  const { refreshAnimatedStyle, startRefreshAnimation, stopRefreshAnimation } = useRefreshAnimation();

  // Payment polling callbacks
  const handlePaymentCompleted = () => {
    setTimeout(() => {
      navigation.replace('PaymentApproved', { amount, currency });
    }, 1000);
  };

  const handlePaymentFailed = () => {
    setTimeout(() => {
      navigation.replace('PaymentError', { amount, currency });
    }, 1000);
  };

  const paymentPolling = usePaymentPolling({
    paymentLinkId: qrGeneration.paymentLinkId,
    paymentUrl: qrGeneration.paymentUrl,
    onStatusChange: setPaymentStatus,
    onPaymentCompleted: handlePaymentCompleted,
    onPaymentFailed: handlePaymentFailed,
  });

  // Effect to generate QR code when onboarding is verified
  useEffect(() => {
    if (!onboardingVerified) {
      console.log('⏳ Waiting for onboarding verification before generating QR code...');
            return;
          }

    qrGeneration.generateQRCode();

    // Cleanup on unmount
    return () => {
      paymentPolling.cleanup();
    };
  }, [onboardingVerified]);

  // Effect to start polling when payment data is available
  useEffect(() => {
    if (qrGeneration.paymentUrl && qrGeneration.paymentLinkId && !qrGeneration.loading) {
      console.log(`🔄 Starting delayed polling for payment URL:`, qrGeneration.paymentUrl, 'ID:', qrGeneration.paymentLinkId);

      paymentPolling.stopStatusPolling();

      setTimeout(() => {
        if (qrGeneration.paymentUrl && qrGeneration.paymentLinkId) {
          paymentPolling.startStatusPolling();
        }
      }, PAYMENT_CONSTANTS.POLLING_START_DELAY);
    }
  }, [qrGeneration.paymentUrl, qrGeneration.paymentLinkId, qrGeneration.loading]);

  // Effect for aggressive cleanup on mount
  useEffect(() => {
    console.log('🧹 Cleaning up any lingering polling intervals on mount');

    // Clear any intervals that might exist globally
    const clearAllIntervals = () => {
      for (let i = 1; i < 10000; i++) {
        try {
          clearInterval(i);
          clearTimeout(i);
        } catch (e) {
          // Ignore errors for non-existent intervals
        }
      }
    };

    clearAllIntervals();
    console.log('✅ All intervals and timeouts cleared globally');

    // Cleanup on unmount
    return () => {
      stopRefreshAnimation();
      paymentPolling.cleanup();
    };
  }, []);

  // Handlers
  const handleRefresh = () => {
    paymentPolling.stopStatusPolling();
    setPaymentStatus('pending');

    // Start refresh animation
    startRefreshAnimation();
    
    // Refresh QR code
    qrGeneration.refreshQRCode();
    
    // Stop animation when refresh completes
    setTimeout(() => {
      stopRefreshAnimation();
            }, 2000);
  };

  const handleRetry = () => {
    console.log('🔄 Manual QR generation retry triggered');
    qrGeneration.refreshQRCode();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const userFirstName = user?.fullName?.split(' ')[0] || 'me';
      const shareMessage = `Scan this QR code to pay ${userFirstName} $${formatDisplayAmount(amount)} ${currency}`;

      if (qrCodeRef.current && qrGeneration.paymentUrl) {
        // Capture the QR code as an image
        const uri = await captureRef(qrCodeRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Payment QR Code',
          });
        } else {
          // Fallback to regular share
          await Share.share({
            message: generateShareMessage(userFirstName, amount, currency, qrGeneration.paymentUrl),
            title: 'Payment Request'
          });
        }
      } else if (qrGeneration.paymentUrl) {
        // Fallback if we can't capture the QR code
        await Share.share({
          message: generateShareMessage(userFirstName, amount, currency, qrGeneration.paymentUrl),
          title: 'Payment Request'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to regular share if image capture fails
      try {
        const userFirstName = user?.fullName?.split(' ')[0] || 'me';
        const fallbackMessage = generateShareMessage(userFirstName, amount, currency, qrGeneration.paymentUrl || '');

        await Share.share({
          message: fallbackMessage,
          title: 'Payment Request'
        });
      } catch (fallbackError) {
        console.error('Error with fallback share:', fallbackError);
              Toast.show({
                type: 'error',
          text1: 'Share Failed',
          text2: 'Please try again'
              });
            }
          }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleSharePaymentLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (qrGeneration.paymentUrl) {
      try {
        const userFirstName = user?.fullName?.split(' ')[0] || 'me';
        const shareMessage = generateShareMessage(userFirstName, amount, currency, qrGeneration.paymentUrl, false);

        await Share.share({
          message: `${shareMessage}\n\n${qrGeneration.paymentUrl}`,
          title: 'Payment Link',
          url: qrGeneration.paymentUrl // iOS specific
        });
      } catch (error) {
        console.error('Error sharing payment link:', error);
        Toast.show({
          type: 'error',
          text1: 'Share Failed',
          text2: 'Please try again'
        });
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header 
        paymentUrl={qrGeneration.paymentUrl}
        onSharePaymentLink={handleSharePaymentLink}
      />

      <View style={styles.content}>
        <AmountDisplay amount={amount} currency={currency} />

        <QRCodeSection
          ref={qrCodeRef}
          loading={qrGeneration.loading}
          paymentUrl={qrGeneration.paymentUrl}
          amount={amount}
          currency={currency}
          error={qrGeneration.error}
          qrScaleAnimation={qrGeneration.qrScaleAnimation}
          onRetry={handleRetry}
        />

        <InstructionsSection paymentStatus={paymentStatus} />
      </View>

      <BottomActions
        paymentStatus={paymentStatus}
        refreshAnimatedStyle={refreshAnimatedStyle}
        onRefresh={handleRefresh}
        onClose={handleClose}
        onShare={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
});