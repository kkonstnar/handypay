import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTransactions } from '../contexts/TransactionContext';

export type TransactionDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'TransactionDetails'>;

export default function TransactionDetailsScreen({ navigation, route }: TransactionDetailsScreenProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;
  const { getTransaction, cancelTransaction } = useTransactions();
  const transaction = getTransaction(transactionId);

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel Transaction',
      'Are you sure you want to cancel this transaction?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // Extract Stripe payment link ID from the transaction
              let stripePaymentLinkId = transaction.id;

              // If the transaction ID is a client-side ID (starts with 'ctx_'),
              // try to extract the Stripe ID from the qrCode URL
              if (transaction.id.startsWith('ctx_') && transaction.qrCode) {
                // Extract the Stripe payment link ID from URL like:
                // https://buy.stripe.com/test_9B600jgPWbLzb9k5Hb4gg0c
                const urlMatch = transaction.qrCode.match(/\/([^\/]+)$/);
                if (urlMatch) {
                  stripePaymentLinkId = urlMatch[1];
                  console.log('🔄 Extracted Stripe payment link ID for cancel:', stripePaymentLinkId);
                }
              }

              console.log('🗑️ Cancelling transaction with ID:', stripePaymentLinkId);
              await cancelTransaction(stripePaymentLinkId, user?.id || '');

              navigation.goBack();
            } catch (error) {
              console.error('Failed to cancel transaction:', error);
              Alert.alert('Error', 'Failed to cancel transaction. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#3AB75C';
      case 'pending': return '#f59e0b';
      case 'failed': return '#dc2626';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      case 'cancelled': return 'ban';
      default: return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: transaction.amount >= 0 ? '#3AB75C' : '#111827' }]}>
            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text style={styles.description}>{transaction.description}</Text>
          {transaction.merchant && (
            <Text style={styles.merchant}>{transaction.merchant}</Text>
          )}
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
            <Ionicons name={getStatusIcon(transaction.status)} size={16} color={getStatusColor(transaction.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {transaction.date.toLocaleDateString()} at {transaction.date.toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>

          {transaction.cardLast4 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card</Text>
              <Text style={styles.detailValue}>****{transaction.cardLast4}</Text>
            </View>
          )}

          {transaction.expiresAt && transaction.status === 'pending' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={styles.detailValue}>
                {transaction.expiresAt.toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {transaction.status === 'pending' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280'
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8
  },
  description: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  merchant: {
    fontSize: 16,
    color: '#6b7280'
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  detailsSection: {
    marginBottom: 32
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  detailLabel: {
    fontSize: 16,
    color: '#6b7280',
    flex: 1
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 2,
    textAlign: 'right'
  },
  actionsSection: {
    marginTop: 'auto',
    paddingBottom: 32
  },
  cancelButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
});