import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentStatus } from '../../hooks/usePaymentPolling';

interface InstructionsSectionProps {
  paymentStatus: PaymentStatus;
}

export const InstructionsSection: React.FC<InstructionsSectionProps> = ({
  paymentStatus,
}) => {
  const getTitle = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment completed successfully!';
      case 'failed':
        return 'Payment could not be completed';
      default:
        return 'Scan QR code to complete payment';
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'pending':
        return 'Awaiting payment (single-use)';
      case 'completed':
        return 'Payment received - link deactivated';
      case 'failed':
        return 'Payment failed - try again';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'pending':
        return <ActivityIndicator size="small" color="#3AB75C" />;
      case 'completed':
        return <Ionicons name="checkmark-circle" size={20} color="#3AB75C" />;
      case 'failed':
        return <Ionicons name="close-circle" size={20} color="#EF4444" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.instructionsSection}>
      <Text style={styles.instructionsTitle}>
        {getTitle()}
      </Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {getStatusText()}
        </Text>
        {getStatusIcon()}
      </View>
      {paymentStatus === 'completed' && (
        <Text style={[styles.statusText, styles.completedNote]}>
          This payment link has been deactivated to prevent duplicate payments.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  completedNote: {
    fontSize: 14,
    marginTop: 8,
    color: '#6B7280'
  },
});
