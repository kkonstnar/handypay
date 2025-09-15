import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { PaymentStatus } from '../../hooks/usePaymentPolling';

interface BottomActionsProps {
  paymentStatus: PaymentStatus;
  refreshAnimatedStyle: AnimatedStyle;
  onRefresh: () => void;
  onClose: () => void;
  onShare: () => void;
}

export const BottomActions: React.FC<BottomActionsProps> = ({
  paymentStatus,
  refreshAnimatedStyle,
  onRefresh,
  onClose,
  onShare,
}) => {
  const isCompleted = paymentStatus === 'completed';

  return (
    <View style={styles.bottomActions}>
      <TouchableOpacity
        style={[styles.actionButton, isCompleted && styles.disabledButton]}
        onPress={isCompleted ? undefined : onRefresh}
        activeOpacity={isCompleted ? 1 : 0.7}
      >
        <Animated.View style={refreshAnimatedStyle}>
          <Ionicons
            name="refresh"
            size={24}
            color={isCompleted ? '#9CA3AF' : '#111827'}
          />
        </Animated.View>
        <Text style={[styles.actionText, isCompleted && styles.disabledText]}>
          Refresh
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={24} color="#dc2626" />
        <Text style={[styles.actionText, { color: '#dc2626' }]}>Close</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, isCompleted && styles.disabledButton]}
        onPress={isCompleted ? undefined : onShare}
        activeOpacity={isCompleted ? 1 : 0.7}
      >
        <Ionicons
          name="share"
          size={24}
          color={isCompleted ? '#9CA3AF' : '#111827'}
        />
        <Text style={[styles.actionText, isCompleted && styles.disabledText]}>
          Share
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
