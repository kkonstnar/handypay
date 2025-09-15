import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Animated, { SharedValue } from 'react-native-reanimated';
import { formatDisplayAmount, PAYMENT_CONSTANTS } from '../../utils/paymentUtils';

interface QRCodeSectionProps {
  loading: boolean;
  paymentUrl: string | null;
  amount: number;
  currency: string;
  error: string | null;
  qrScaleAnimation: SharedValue<number>;
  onRetry: () => void;
}

export const QRCodeSection = forwardRef<View, QRCodeSectionProps>(({
  loading,
  paymentUrl,
  amount,
  currency,
  error,
  qrScaleAnimation,
  onRetry,
}, ref) => {
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3AB75C" />
          <Text style={styles.loadingText}>Creating QR Code...</Text>
        </View>
      );
    }

    if (paymentUrl) {
      return (
        <Animated.View 
          style={[
            styles.qrCodeWithAmount,
            {
              transform: [{ scale: qrScaleAnimation }]
            }
          ]}
        >
          <QRCode
            value={paymentUrl}
            size={PAYMENT_CONSTANTS.QR_SIZE}
            color="#3AB75C"
            backgroundColor="#FFFFFF"
            logoBackgroundColor="#FFFFFF"
          />
          <Text style={styles.qrAmountText}>
            ${formatDisplayAmount(amount)} {currency}
          </Text>
        </Animated.View>
      );
    }

    // Error state
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="qr-code-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to generate QR code</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.qrCodeContainer} ref={ref}>
      <View style={styles.qrCodeSquare}>
        {renderContent()}
      </View>
    </View>
  );
});

QRCodeSection.displayName = 'QRCodeSection';

const styles = StyleSheet.create({
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
    justifyContent: 'center'
  },
  qrCodeSquare: {
    width: 260,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center'
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
});
