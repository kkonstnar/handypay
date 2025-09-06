import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { useUser } from '../../contexts/UserContext';
import { StripePaymentService } from '../../services/StripePaymentService';
import Toast from 'react-native-toast-message';
// Network monitoring is now handled globally by NetworkProvider

export type ScanToPayScreenProps = NativeStackScreenProps<RootStackParamList, 'ScanToPay'>;

// Helper function to format amounts with commas (same as home page)
function formatDisplayAmount(amount: number): string {
  const amountStr = amount.toFixed(2);
  const [wholePart, decimalPart] = amountStr.split('.');
  const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formattedWhole}.${decimalPart}`;
}

export default function ScanToPayScreen({ navigation, route }: ScanToPayScreenProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { amount, currency, paymentLink: initialPaymentLink } = route.params;
  const { user } = useUser();

  // Simple state management
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [onboardingVerified, setOnboardingVerified] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation value for refresh button rotation
  const refreshRotation = useSharedValue(0);
  const isAnimationRunning = useRef(false);

  // Function to stop the refresh animation
  const stopRefreshAnimation = () => {
    isAnimationRunning.current = false;
    refreshRotation.value = 0;
  };

  // Animated style for refresh button
  const refreshAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${refreshRotation.value % 360}deg` }],
    };
  });

  const qrCodeRef = useRef<View>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const activeIntervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Check if user has completed Stripe onboarding using backend validation
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) return;

      // Network connectivity is now handled globally by NetworkProvider

      try {
        console.log('🔐 ScanToPayScreen - Checking backend onboarding status...');

        // Check backend for real onboarding status
        const response = await fetch(
          `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${user.id}`
        );

        if (response.ok) {
          const backendData = await response.json();
          console.log('📊 ScanToPayScreen - Backend onboarding status:', {
            hasAccount: !!backendData.stripe_account_id,
            onboardingCompleted: backendData.stripe_onboarding_completed
          });

          if (!backendData.stripe_account_id) {
            console.log('❌ No Stripe account found in backend');
            Alert.alert(
              'Complete Setup First',
              'You need to finish your Stripe onboarding before you can generate QR codes for payments.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => navigation.goBack()
                },
                {
                  text: 'Continue Setup',
                  onPress: () => {
                    navigation.replace('GetStartedPage');
                  }
                }
              ]
            );
            return;
          }

          if (!backendData.stripe_onboarding_completed) {
            console.log('❌ Onboarding not completed according to backend');
            Alert.alert(
              'Complete Setup First',
              'You need to finish your Stripe onboarding before you can generate QR codes for payments.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => navigation.goBack()
                },
                {
                  text: 'Continue Setup',
                  onPress: () => {
                    navigation.replace('GetStartedPage');
                  }
                }
              ]
            );
            return;
          }

          // Onboarding is complete, proceed with QR generation
          console.log('✅ Onboarding verified for ScanToPayScreen, proceeding...');
          setOnboardingVerified(true);

        } else {
          console.error('❌ Failed to check backend status for ScanToPayScreen:', response.status);
          Alert.alert('Error', 'Unable to verify account status. Please try again.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('❌ Error checking backend status for ScanToPayScreen:', error);
        // Network errors are now handled globally by NetworkProvider
        Alert.alert('Error', 'Unable to verify account status. Please try again.');
        navigation.goBack();
      }
    };

    checkOnboardingStatus();
    }, [user?.id]);

  // Get current exchange rate with caching
  const getExchangeRate = async (): Promise<number> => {
    try {
      // Try to get fresh rate from API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        const rate = data.rates.JMD;
        // Cache the rate for offline use
        await AsyncStorage.setItem('usd_to_jmd_rate', rate.toString());
        await AsyncStorage.setItem('rate_timestamp', Date.now().toString());
        return rate;
      }
    } catch (error) {
      console.log('Exchange rate API failed, using cached rate');
    }

    // Fallback to cached rate or default
    try {
      const cachedRate = await AsyncStorage.getItem('usd_to_jmd_rate');
      const rateTimestamp = await AsyncStorage.getItem('rate_timestamp');

      if (cachedRate && rateTimestamp) {
        const age = Date.now() - parseInt(rateTimestamp);
        // Use cached rate if less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
          return parseFloat(cachedRate);
        }
      }
    } catch (error) {
      console.log('Failed to get cached rate');
    }

    // Final fallback
    return 156; // Default rate
  };
  const componentKey = useRef<number>(Date.now()); // Force re-render on mount

  // Clean up any lingering polling on component mount
  useEffect(() => {
    console.log('🧹 Cleaning up any lingering polling intervals on mount');

    // More aggressive cleanup - clear ALL intervals globally
    const clearAllIntervals = () => {
      // Clear any intervals that might exist globally
      for (let i = 1; i < 10000; i++) {
        try {
          clearInterval(i);
        } catch (e) {
          // Ignore errors for non-existent intervals
        }
      }

      // Clear any timeouts too
      for (let i = 1; i < 10000; i++) {
        try {
          clearTimeout(i);
        } catch (e) {
          // Ignore errors for non-existent timeouts
        }
      }
    };

    clearAllIntervals();

    // Clear tracked intervals
    activeIntervals.current.forEach(interval => {
      clearInterval(interval);
    });
    activeIntervals.current.clear();

    // Clear our main interval reference
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }

    console.log('✅ All intervals and timeouts cleared globally');

    // Cleanup on unmount
    return () => {
      stopRefreshAnimation();
    };
  }, []);

  // Check payment status function
  const checkPaymentStatus = async () => {
    if (!paymentUrl || !paymentLinkId) {
      console.log('❌ No payment URL or ID available for status check');
      console.log('📊 Current state - URL:', paymentUrl, 'ID:', paymentLinkId);
      return;
    }

    try {
      console.log(`🔍 [${sessionId.current}] Checking status for payment link ID:`, paymentLinkId);

      // Check payment link status via backend
      const response = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/payment-link-status/${paymentLinkId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Payment status response:', data);

        if (data.status === 'completed' || data.status === 'paid') {
          console.log('✅ Payment completed! Navigating to success screen');
          setPaymentStatus('completed');
          stopStatusPolling(); // Stop polling when payment is completed
          // Navigate to success screen
          setTimeout(() => {
            navigation.replace('PaymentApproved', { amount, currency });
    }, 1000);
        } else if (data.status === 'failed' || data.status === 'expired') {
          console.log('❌ Payment failed! Navigating to error screen');
          setPaymentStatus('failed');
          stopStatusPolling(); // Stop polling when payment fails
          // Navigate to error screen
          setTimeout(() => {
            navigation.replace('PaymentError', { amount, currency });
          }, 1000);
          } else {
          console.log('⏳ Payment still pending, status:', data.status);
        }
      } else {
        console.log('❌ Status check API call failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  };

  // Start polling for payment status
  const startStatusPolling = () => {
    // Clean up any existing polling first
    stopStatusPolling();

    console.log(`🔄 [${sessionId.current}] Starting payment status polling with ID:`, paymentLinkId);
    const interval = setInterval(checkPaymentStatus, 3000); // Check every 3 seconds
    statusCheckInterval.current = interval;
    activeIntervals.current.add(interval);
  };

  // Stop polling
  const stopStatusPolling = () => {
    console.log(`🛑 [${sessionId.current}] Stopping payment status polling`);
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      activeIntervals.current.delete(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  };

  // Simple QR code generation
  useEffect(() => {
    // Only proceed if onboarding is verified
    if (!onboardingVerified) {
      console.log('⏳ Waiting for onboarding verification before generating QR code...');
      return;
    }

  const generateQRCode = async () => {
      try {
        console.log('🎯 Starting simple QR generation');

        let paymentUrl = initialPaymentLink;
        let linkId: string | null = null;

        // If no payment link provided, create one
        if (!paymentUrl && user?.id) {
          console.log('💳 Creating Stripe payment link');

          // Validate minimum amount for Stripe (must be at least ~$0.50 USD)
          // Convert minimum to selected currency: 1 USD ≈ 156 JMD
          const MINIMUM_USD = 1.00; // $1.00 USD minimum
          const USD_TO_JMD_RATE = 156; // 1 USD = 156 JMD

          let minimumAmount: number;
          let errorMsg: string;

          if (currency === 'USD') {
            minimumAmount = MINIMUM_USD; // $1.00 USD
            errorMsg = `Amount must be at least $${MINIMUM_USD.toFixed(2)} USD to meet Stripe's minimum requirement.`;
      } else {
            // For JMD, convert USD minimum to JMD equivalent
            minimumAmount = MINIMUM_USD * USD_TO_JMD_RATE; // ~156 JMD
            errorMsg = `Amount must be at least $${minimumAmount.toFixed(2)} JMD ($${MINIMUM_USD.toFixed(2)} USD) to meet Stripe's minimum requirement.`;
          }

                    if (amount < minimumAmount) {
            console.error('❌ Amount too low:', errorMsg);
            setError(errorMsg);
            return;
          }

          const amountInCents = Math.round(amount * 100);
          const paymentResponse = await StripePaymentService.createPaymentLink({
            handyproUserId: user.id,
            customerName: user.fullName || 'Customer',
            customerEmail: user.email || undefined,
            description: `Payment for $${amount.toFixed(2)} ${currency}`,
            amount: amountInCents,
            taskDetails: `Payment of $${amount.toFixed(2)} ${currency}`,
          });

          paymentUrl = paymentResponse.payment_link;
          linkId = paymentResponse.id;
          console.log('✅ Payment link created:', paymentUrl);
          console.log('🔗 Payment link ID:', linkId);
        }

        if (!paymentUrl) {
          throw new Error('No payment URL available');
        }

        // Store the payment URL and ID for QR generation
        console.log('🎨 Payment URL ready for QR:', paymentUrl);
        setPaymentUrl(paymentUrl);
        if (linkId) {
          setPaymentLinkId(linkId);
          console.log('🔗 Payment link ID set for status checking:', linkId);
        }
        console.log('✅ Payment URL set for QR generation');

      } catch (error) {
        console.error('❌ QR Generation failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
      setIsRefreshing(false); // Reset refresh state after QR generation completes
      stopRefreshAnimation(); // Stop the spinning animation
      }
    };

    generateQRCode();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Component unmounting - cleaning up all intervals');
      // Clear all tracked intervals
      activeIntervals.current.forEach(interval => {
        clearInterval(interval);
      });
      activeIntervals.current.clear();

      // Clear main interval
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
    };
  }, [user?.id, amount, currency, initialPaymentLink, onboardingVerified]);

  // Start polling when payment URL and ID become available
  useEffect(() => {
    if (paymentUrl && paymentLinkId && !loading) {
      console.log(`🔄 [${sessionId.current}] Starting delayed polling for payment URL:`, paymentUrl, 'ID:', paymentLinkId);

      // Clean up any existing polling before starting new one
      stopStatusPolling();

    setTimeout(() => {
        // Double-check we still have valid data before starting
        if (paymentUrl && paymentLinkId) {
          startStatusPolling();
        }
      }, 2000); // Start polling 2 seconds after QR is ready
    }
  }, [paymentUrl, paymentLinkId, loading]);



  const handleCopyLink = async () => {
    if (!paymentUrl) {
      console.log('❌ No payment link available to copy');
      return;
    }

    try {
      await Clipboard.setString(paymentUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Link Copied!',
        text2: 'Payment link has been copied to clipboard',
      });
      console.log('✅ Payment link copied to clipboard:', paymentUrl);
    } catch (error) {
      console.error('❌ Failed to copy payment link:', error);
      Toast.show({
        type: 'error',
        text1: 'Copy Failed',
        text2: 'Unable to copy payment link',
      });
    }
  };

  const handleRefresh = () => {
    // Stop current polling
    stopStatusPolling();

    setIsRefreshing(true);
    setLoading(true);
    setError(null);
    setPaymentUrl(null);
    setPaymentLinkId(null);
    setPaymentStatus('pending');

    // Start continuous spinning animation until refresh completes
    isAnimationRunning.current = true;

    const animateOnce = () => {
      'worklet';
      refreshRotation.value = withTiming(refreshRotation.value + 360, {
        duration: 1000,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          runOnJS(() => {
            if (isAnimationRunning.current) {
              // Continue spinning if still refreshing
              animateOnce();
            }
          })();
        }
      });
    };

    // Start the animation
    runOnJS(() => {
      animateOnce();
    })();

    // Re-run the QR generation
    setTimeout(() => {
      const generateQRCode = async () => {
        try {
          let paymentUrl = initialPaymentLink;
          let linkId: string | null = null;

          if (!paymentUrl && user?.id) {
            // Validate minimum amount for Stripe (must be at least ~$0.50 USD)
            // Since 1 USD ≈ 156 JMD, minimum should be at least 78 JMD
            const MINIMUM_JMD_AMOUNT = 100; // $1.00 USD equivalent minimum
            if (amount < MINIMUM_JMD_AMOUNT) {
              const errorMsg = `Amount must be at least $${MINIMUM_JMD_AMOUNT.toFixed(2)} JMD (approximately $0.64 USD) to meet Stripe's minimum requirement.`;
              console.error('❌ Amount too low:', errorMsg);
              setError(errorMsg);
              return;
            }

            const amountInCents = Math.round(amount * 100);
            const paymentResponse = await StripePaymentService.createPaymentLink({
              handyproUserId: user.id,
              customerName: user.fullName || 'Customer',
              customerEmail: user.email || undefined,
              description: `Payment for $${amount.toFixed(2)} ${currency}`,
              amount: amountInCents,
              taskDetails: `Payment of $${amount.toFixed(2)} ${currency}`,
            });
            paymentUrl = paymentResponse.payment_link;
            linkId = paymentResponse.id;
          }

          if (paymentUrl) {
            setPaymentUrl(paymentUrl);
            if (linkId) {
              setPaymentLinkId(linkId);
            }
            // Restart polling for the new payment link
      setTimeout(() => {
              startStatusPolling();
            }, 2000);
      }
    } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to refresh');
    } finally {
      setLoading(false);
        }
      };

      generateQRCode();
    }, 500);
  };



  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Get user's first name for personalized message
      const userFirstName = user?.fullName?.split(' ')[0] || 'me';
      const shareMessage = `Scan this QR code to pay ${userFirstName} $${formatDisplayAmount(amount)} ${currency}`;

      if (qrCodeRef.current && paymentUrl) {
        // Capture the QR code as an image
        const uri = await captureRef(qrCodeRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
        });
        
        // Check if sharing is available (it should be on iOS/Android)
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Share the image with personalized message
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Payment QR Code',
          });
        } else {
          // Fallback to regular share
          await Share.share({
            message: `${shareMessage}\n\n${paymentUrl}`,
            title: 'Payment Request'
          });
        }
      } else if (paymentUrl) {
        // Fallback if we can't capture the QR code
        await Share.share({
          message: `${shareMessage}\n\n${paymentUrl}`,
          title: 'Payment Request'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to regular share if image capture fails
      try {
        const userFirstName = user?.fullName?.split(' ')[0] || 'me';
        const fallbackMessage = `Scan this QR code to pay ${userFirstName} $${formatDisplayAmount(amount)} ${currency}\n\n${paymentUrl}`;

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Network banner is now handled globally by NetworkProvider */}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.headerButton, !paymentUrl && styles.disabledHeaderButton]}
          onPress={paymentUrl ? handleCopyLink : undefined}
          activeOpacity={paymentUrl ? 0.7 : 1}
          disabled={!paymentUrl}
        >
          <Ionicons
            name="link"
            size={24}
            color={paymentUrl ? "#111827" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('PaymentApproved', { amount, currency });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amount}>${formatDisplayAmount(amount)}</Text>
          <Text style={styles.currency}>{currency.toLowerCase()}</Text>
        </View>



        {/* QR Code */}
        <View style={styles.qrCodeContainer} ref={qrCodeRef}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3AB75C" />
              <Text style={styles.loadingText}>Creating QR Code...</Text>
            </View>
          ) : paymentUrl ? (
            <View style={styles.qrCodeWithAmount}>
              <QRCode
                value={paymentUrl}
                size={240}
                color="#3AB75C"
                backgroundColor="#FFFFFF"
                logoBackgroundColor="#FFFFFF"
              />
              <Text style={styles.qrAmountText}>${formatDisplayAmount(amount)} {currency}</Text>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="qr-code-outline" size={64} color="#EF4444" />
              <Text style={styles.errorText}>Failed to generate QR code</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  console.log('🔄 Manual QR generation retry triggered');
                  setLoading(true);
                  setError(null);
                  setPaymentUrl(null);
                  setPaymentLinkId(null);

                  // Re-run the QR generation
                  setTimeout(() => {
                    const generateQRCode = async () => {
                      try {
                        let paymentUrl = initialPaymentLink;
                        let linkId: string | null = null;

                        if (!paymentUrl && user?.id) {
                          // Validate minimum amount for Stripe (must be at least ~$0.50 USD)
                          const MINIMUM_USD = 1.00; // $1.00 USD minimum
                          const exchangeRate = await getExchangeRate();

                          let minimumAmount: number;
                          let errorMsg: string;

                          if (currency === 'USD') {
                            minimumAmount = MINIMUM_USD; // $1.00 USD
                            errorMsg = `Amount must be at least $${MINIMUM_USD.toFixed(2)} USD to meet Stripe's minimum requirement.`;
                          } else {
                            // For JMD, convert USD minimum to JMD equivalent
                            minimumAmount = MINIMUM_USD * exchangeRate;
                            errorMsg = `Amount must be at least $${minimumAmount.toFixed(2)} JMD ($${MINIMUM_USD.toFixed(2)} USD) to meet Stripe's minimum requirement.`;
                          }

                          if (amount < minimumAmount) {
                            console.error('❌ Amount too low:', errorMsg);
                            setError(errorMsg);
                            return;
                          }

                          const amountInCents = Math.round(amount * 100);
                          const paymentResponse = await StripePaymentService.createPaymentLink({
                            handyproUserId: user.id,
                            customerName: user.fullName || 'Customer',
                            customerEmail: user.email || undefined,
                            description: `Payment for $${amount.toFixed(2)} ${currency}`,
                            amount: amountInCents,
                            taskDetails: `Payment of $${amount.toFixed(2)} ${currency}`,
                          });
                          paymentUrl = paymentResponse.payment_link;
                          linkId = paymentResponse.id;
                        }

                        if (paymentUrl) {
                          setPaymentUrl(paymentUrl);
                          if (linkId) {
                            setPaymentLinkId(linkId);
                          }
                        }
                      } catch (error) {
                        setError(error instanceof Error ? error.message : 'Failed to refresh');
                      } finally {
                        setLoading(false);
                      }
                    };

                  generateQRCode();
                  }, 500);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>
            {paymentStatus === 'completed'
              ? 'Payment completed successfully!'
              : paymentStatus === 'failed'
              ? 'Payment could not be completed'
              : 'Scan QR code to complete payment'}
          </Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {paymentStatus === 'pending' && 'Awaiting payment (single-use)'}
              {paymentStatus === 'completed' && 'Payment received - link deactivated'}
              {paymentStatus === 'failed' && 'Payment failed - try again'}
            </Text>
            {paymentStatus === 'pending' ? (
            <ActivityIndicator size="small" color="#3AB75C" />
            ) : paymentStatus === 'completed' ? (
              <Ionicons name="checkmark-circle" size={20} color="#3AB75C" />
            ) : (
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            )}
          </View>
          {paymentStatus === 'completed' && (
            <Text style={[styles.statusText, { fontSize: 14, marginTop: 8, color: '#6B7280' }]}>
              This payment link has been deactivated to prevent duplicate payments.
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, paymentStatus === 'completed' && styles.disabledButton]}
          onPress={paymentStatus === 'completed' ? undefined : handleRefresh}
          activeOpacity={paymentStatus === 'completed' ? 1 : 0.7}
        >
          <Animated.View style={refreshAnimatedStyle}>
            <Ionicons
              name="refresh"
              size={24}
              color={paymentStatus === 'completed' ? '#9CA3AF' : '#111827'}
            />
          </Animated.View>
          <Text style={[styles.actionText, paymentStatus === 'completed' && styles.disabledText]}>
            Refresh
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#dc2626" />
          <Text style={[styles.actionText, { color: '#dc2626' }]}>Close</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, paymentStatus === 'completed' && styles.disabledButton]}
          onPress={paymentStatus === 'completed' ? undefined : handleShare}
          activeOpacity={paymentStatus === 'completed' ? 1 : 0.7}
        >
          <Ionicons
            name="share"
            size={24}
            color={paymentStatus === 'completed' ? '#9CA3AF' : '#111827'}
          />
          <Text style={[styles.actionText, paymentStatus === 'completed' && styles.disabledText]}>
            Share
                      </Text>
                        </TouchableOpacity>
                    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabledHeaderButton: {
    backgroundColor: '#f9fafb',
    opacity: 0.6
  },
  continueButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  currency: {
    fontSize: 20,
    color: '#9ca3af',
    marginLeft: 8,
    fontWeight: '500'
  },

  qrCodeContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 8,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280
  },
  qrCodeWithAmount: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrAmountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'DMSans-Medium',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontFamily: 'DMSans-Medium',
  },
  retryButton: {
    backgroundColor: '#3AB75C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans-Medium',
  },
  qrCodeImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
  },
  instructionsSection: {
    alignItems: 'center',
    paddingHorizontal: 24
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusText: {
    fontSize: 16,
    color: '#6b7280',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  viewDetailsButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 8
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3AB75C',
    fontWeight: '500',
    textAlign: 'center'
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 24
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827'
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  modalContent: {
    flex: 1
  },
  modalAmountSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalAmount: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  modalDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center'
  },
  modalSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
    
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalLabel: {
    fontSize: 16,
    color: '#6b7280'
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16
  },
  modalValueMono: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'monospace',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  modalActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    gap: 12
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600'
  }
});