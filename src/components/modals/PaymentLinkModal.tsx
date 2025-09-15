import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { StripePaymentService, PaymentLinkResponse } from '../../services/StripePaymentService';

import { useUser } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import SystemBannerContainer from '../ui/SystemBannerContainer';

import Toast from 'react-native-toast-message';

// Home icon component (same as home tab)
const HomeIcon = ({ size = 20, color = '#3AB75C' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size * 18/21} viewBox="0 0 21 18" fill="none">
    <Path d="M18.9965 12.2725C18.5884 12.2725 18.1802 12.5793 18.1802 13.0907V15.1361C18.1802 15.852 17.5679 16.3634 16.9557 16.3634H14.9149C14.5067 16.3634 14.0986 16.6702 14.0986 17.1816C14.0986 17.6929 14.4047 17.9998 14.9149 17.9998H16.9557C18.4863 17.9998 19.8128 16.7725 19.8128 15.1361V13.0907C19.8128 12.6816 19.4047 12.2725 18.9965 12.2725Z" fill={color}/>
    <Path d="M14.9149 1.63637H16.9557C17.67 1.63637 18.1802 2.25 18.1802 2.86364V4.90909C18.1802 5.31818 18.4864 5.72727 18.9966 5.72727C19.5068 5.72727 19.8129 5.42046 19.8129 4.90909V2.86364C19.8129 1.32955 18.5884 0 16.9557 0H14.9149C14.5068 0 14.0986 0.30682 14.0986 0.81818C14.0986 1.32955 14.5068 1.63637 14.9149 1.63637Z" fill={color}/>
    <Path d="M6.75147 16.3634H4.71066C3.99637 16.3634 3.48617 15.7498 3.48617 15.1361V13.0907C3.48617 12.6816 3.18005 12.2725 2.66984 12.2725C2.15964 12.2725 1.85352 12.6816 1.85352 13.0907V15.1361C1.85352 16.6702 3.07801 17.9998 4.71066 17.9998H6.75147C7.15964 17.9998 7.5678 17.6929 7.5678 17.1816C7.5678 16.6702 7.15964 16.3634 6.75147 16.3634Z" fill={color}/>
    <Path d="M2.66984 5.72727C3.07801 5.72727 3.48617 5.42046 3.48617 4.90909V2.86364C3.48617 2.14773 4.09842 1.63637 4.71066 1.63637H6.75148C7.15964 1.63637 7.5678 1.32955 7.5678 0.81818C7.5678 0.30682 7.15964 0 6.75148 0H4.71066C3.18005 0 1.85352 1.32955 1.85352 2.86364V4.90909C1.85352 5.31818 2.26168 5.72727 2.66984 5.72727Z" fill={color}/>
    <Path d="M14.915 15.1363C16.0375 15.1363 16.9559 14.2159 16.9559 13.0909V11.25H4.71094V13.0909C4.71094 14.2159 5.62931 15.1363 6.75176 15.1363H14.915Z" fill={color}/>
    <Path d="M20.0167 8.18143H16.9555V4.90873C16.9555 3.78373 16.0371 2.86328 14.9146 2.86328H6.75138C5.62893 2.86328 4.71056 3.78373 4.71056 4.90873V8.38603H1.64934C1.24117 8.38603 0.833008 8.69283 0.833008 9.20423C0.833008 9.71553 1.13913 10.0223 1.64934 10.0223H20.0167C20.4248 10.0223 20.833 9.71553 20.833 9.20423C20.833 8.69283 20.4248 8.18143 20.0167 8.18143Z" fill={color}/>
  </Svg>
);

interface PaymentLinkModalProps {
  visible: boolean;
  amount: number;
  currency: string;
  onClose: () => void;
  onCopyLink: (link: string) => void;
  onShareLink: (link: string) => void;
}

export default function PaymentLinkModal({
  visible,
  amount,
  currency,
  onClose,
  onCopyLink,
  onShareLink
}: PaymentLinkModalProps): React.ReactElement {
  const { user } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentLinkResponse | null>(null);

  // Network connectivity is now handled globally by NetworkProvider

  const [error, setError] = useState<string | null>(null);

  // Generate payment link when modal becomes visible
  useEffect(() => {
    if (visible && user?.id && amount > 0) {
      generatePaymentLink();
    }
  }, [visible, user?.id, amount, currency]);

  const generatePaymentLink = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    // Network connectivity is now handled globally by NetworkProvider

    setLoading(true);
    setError(null);
    setPaymentData(null);

    try {
      console.log('🔍 PaymentLinkModal - Checking user account:', {
        userId: user?.id,
        userEmail: user?.email,
        userExists: !!user
      });

      // Check if user has a valid Stripe account first
      const accountStatus = await StripePaymentService.getAccountStatus(user.id);

      if (!accountStatus.charges_enabled) {
        throw new Error('Your Stripe account is not ready to accept payments. Please complete your onboarding first.');
      }

      // Create Stripe payment link
      console.log('💰 PaymentLinkModal - Creating payment link:', {
        amount,
        currency,
        userId: user.id
      });

      const amountInCents = StripePaymentService.dollarsToCents(amount);
      console.log('💰 Amount conversion:', { amount, amountInCents });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Payment link creation timed out')), 30000)
      );

      const paymentLinkResponse = await Promise.race([
        StripePaymentService.createPaymentLink({
          handyproUserId: user.id,
          customerName: user.fullName || 'Customer',
          customerEmail: user.email || undefined,
          description: `Payment request `,
          amount: amountInCents,
          taskDetails: `Payment of $${amount.toFixed(2)} ${currency}`,
          currency: currency, // Pass the selected currency
          paymentSource: "payment_link_modal", // Mark as payment link modal
        }),
        timeoutPromise
      ]) as any;

      console.log('✅ Payment link created:', paymentLinkResponse);

      setPaymentData(paymentLinkResponse);

      // Show success toast for payment link creation
      Toast.show({
        type: 'success',
        text1: 'Payment link created!',
        text2: 'Ready to share with customers'
      });

    } catch (error) {
      console.error('❌ Error generating payment link:', error);

      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      let errorMessage = errorObj.message;
      let userFriendlyMessage = 'Please check your Stripe setup and try again';

      // Provide more specific error messages based on common Stripe issues
      if (errorMessage.includes('payment method') || errorMessage.includes('payment method types')) {
        userFriendlyMessage = 'Payment methods not properly configured. Please check your Stripe account settings or contact support';
      } else if (errorMessage.includes('account not ready')) {
        userFriendlyMessage = 'Your Stripe account needs onboarding completion';
      } else if (errorMessage.includes('destination') || errorMessage.includes('jamaica')) {
        userFriendlyMessage = 'Jamaican accounts require destination charges setup. Contact support to configure your account';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userFriendlyMessage = 'Authentication error. Please log out and log back in';
      } else if (errorMessage.includes('500')) {
        userFriendlyMessage = 'Server error. Please try again in a few minutes';
      }

      console.log('🔧 Error details:', {
        originalError: errorMessage,
        userFriendlyMessage,
        userId: user.id
      });

      setError(userFriendlyMessage);

      // Show single error toast with specific guidance
      Toast.show({
        type: 'error',
        text1: 'Payment Link Failed',
        text2: userFriendlyMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (paymentData?.payment_link) {
      onCopyLink(paymentData.payment_link);
    }
  };

  const handleShareLink = () => {
    if (paymentData?.payment_link) {
      onShareLink(paymentData.payment_link);
    }
  };

  const paymentLink = paymentData?.payment_link || `https://handypay.com/pay?amount=${amount.toFixed(2)}&currency=${currency}&id=${Date.now()}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Network banner is now handled globally by NetworkProvider */}

        <View style={styles.content}>
          <Text style={styles.title}>Payment Link</Text>
          <Text style={styles.subtitle}>
            Share this secure link with your customer to receive payment for ${amount.toFixed(2)} {currency}
          </Text>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3AB75C" />
              <Text style={styles.loadingText}>Creating payment link...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={generatePaymentLink}
                activeOpacity={0.7}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success State */}
          {!loading && !error && paymentData && (
            <>
              {/* Link Display */}
              <View style={styles.linkContainer}>
                <Text style={styles.linkLabel}>Payment Link</Text>
                <View style={styles.linkRow}>
                  <TouchableOpacity
                    style={styles.urlTouchable}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleCopyLink();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.url} numberOfLines={1}>
                      {paymentLink}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.linkActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleCopyLink();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy" size={20} color="#3AB75C" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleShareLink();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share" size={20} color="#3AB75C" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onClose();
                        navigation.navigate('ScanToPay', {
                          paymentLink: paymentData?.payment_link || '',
                          amount: amount,
                          currency: currency
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <HomeIcon size={20} color="#3AB75C" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Payment Status */}
              <View style={styles.statusContainer}>
                <View style={styles.statusRow}>
                  <Ionicons name="information-circle" size={16} color="#6B7280" />
                  <Text style={styles.statusText}>
                    Status: {paymentData.status === 'open' ? 'Ready to pay' : paymentData.status}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  content: {
    flex: 1,
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -1,
    fontFamily: 'DMSans-SemiBold'
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'DMSans-Medium'
  },
  linkContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    marginBottom: 32
  },
  linkLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  urlTouchable: {
    flex: 1,
    marginRight: 12
  },
  url: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
    lineHeight: 20
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtons: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginBottom: 32
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#3AB75C',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)'
  },
  lastButton: {
    borderBottomWidth: 0
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  buttonContent: {
    flex: 1
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'DMSans-Medium'
  },
  buttonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'DMSans-Medium'
  },
  note: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'DMSans-Medium'
  },
  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'DMSans-Medium',
  },
  // Error styles
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    fontFamily: 'DMSans-Medium',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#3AB75C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans-Medium',
  },
  // QR Code styles
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'DMSans-SemiBold',
  },
  qrCodeWrapper: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  qrDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: 'DMSans-Medium',
  },
  // Status styles
  statusContainer: {
    marginTop: 16,
    borderTopColor: '#e5e7eb',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontFamily: 'DMSans-Medium',
  },

});