import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Transaction } from '../../contexts/TransactionContext';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
  onCancelTransaction?: (transactionId: string) => void;
}

export default function TransactionDetailsModal({
  transaction,
  visible,
  onClose,
  onCancelTransaction
}: TransactionDetailsModalProps): React.ReactElement | null {
  if (!transaction) return null;

  const handleShareTransaction = async (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let message = '';
      let title = '';

      // Check if this is a payment link transaction
      if (transaction.type === 'payment_link' && transaction.stripePaymentLinkId) {
        // Share the actual payment link
        const paymentLinkUrl = `https://buy.stripe.com/test_${transaction.stripePaymentLinkId}`;
        message = `Pay  $${Math.abs(transaction.amount).toFixed(2)} ${transaction.description ? `` : ''}\n\n${paymentLinkUrl}\n\nShared from HandyPay`;
        title = 'Payment Link';
      } else {
        // Share transaction details
        message = `Transaction Details\n\nAmount: $${Math.abs(transaction.amount).toFixed(2)}\nDescription: ${transaction.description}${transaction.merchant ? `\nMerchant: ${transaction.merchant}` : ''}\nDate: ${transaction.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\nTime: ${transaction.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}${transaction.cardLast4 ? `\nCard: •••• •••• •••• ${transaction.cardLast4}` : ''}\n\nShared from HandyPay`;
        title = 'Transaction Details';
      }

      await Share.share({
        message: message,
        title: title
      });
    } catch (error) {
      console.error('Error sharing transaction:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Download Receipt',
      `Download receipt for ${transaction.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => Alert.alert('Success', 'Receipt downloaded to your Files app')
        }
      ]
    );
  };

  const handleReportIssue = (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Report Issue',
      `Report an issue with this transaction?\n\n${transaction.description}\n$${Math.abs(transaction.amount).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report Issue', 
          style: 'destructive',
          onPress: () => Alert.alert('Issue Reported', 'We will investigate this transaction and get back to you within 2 business days.')
        }
      ]
    );
  };

  const handleCancelTransaction = async (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isPaymentLink = transaction.paymentMethod === 'payment_link';
    const cancelType = isPaymentLink ? 'payment link' : 'transaction';

    Alert.alert(
      `Cancel ${cancelType.charAt(0).toUpperCase() + cancelType.slice(1)}`,
      `Are you sure you want to cancel this ${cancelType}?\n\n${transaction.description}\n$${Math.abs(transaction.amount).toFixed(2)}\n\n${isPaymentLink ? 'This will make the payment link inactive and customers will no longer be able to pay.' : 'This action cannot be undone.'}`,
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading alert
              Alert.alert('Cancelling...', 'Please wait while we process your request.');

              // Call the async cancel function
              await onCancelTransaction?.(transaction.id);

              // Show success
              Alert.alert(
                'Success',
                `${cancelType.charAt(0).toUpperCase() + cancelType.slice(1)} cancelled successfully`,
                [{ text: 'OK' }]
              );

              onClose();
            } catch (error) {
              console.error('Error cancelling transaction:', error);
              Alert.alert(
                'Error',
                `Failed to cancel ${cancelType}. Please try again.`,
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
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
          <Text style={styles.title}>Transaction Details</Text>
          <TouchableOpacity onPress={() => handleShareTransaction(transaction)} activeOpacity={0.7}>
            <Ionicons name="share" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={[
              styles.amount,
              { color: '#111827' }
            ]}>
              ${transaction.amount.toFixed(2)}
            </Text>
            <Text style={styles.description}>{transaction.description}</Text>
            {transaction.merchant && (
              <Text style={styles.merchant}>{transaction.merchant}</Text>
            )}
          </View>
          
          {/* Status */}
          <View style={styles.section}>
            <View style={styles.row}>
            <Text style={styles.sectionTitle}>Status</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: 
                    transaction.status === 'completed' ? '#dcfce7' : 
                    transaction.status === 'failed' ? '#fef2f2' :
                    transaction.status === 'cancelled' ? '#f3f4f6' : '#fef3c7' 
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: 
                      transaction.status === 'completed' ? '#3AB75C' : 
                      transaction.status === 'failed' ? '#dc2626' :
                      transaction.status === 'cancelled' ? '#6b7280' : '#d97706' 
                  }
                ]}>
                  {transaction.status === 'completed' ? 'Completed' : 
                   transaction.status === 'failed' ? 'Failed' :
                   transaction.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Transaction Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Information</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>
                {transaction.date.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>
                {transaction.date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>
                {transaction.paymentMethod === 'qr_code' ? 'QR Code Payment' :
                 transaction.paymentMethod === 'payment_link' ? 'Payment Link' :
                 'Payment Received'}
              </Text>
            </View>
            
            
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID</Text>
              <Text style={styles.valueMono}>{transaction.id}A2C4-{transaction.date.getTime()}</Text>
            </View>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => handleDownloadReceipt(transaction)}
            >
              <Ionicons name="download" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Download Receipt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7}
              onPress={() => handleReportIssue(transaction)}
            >
              <Ionicons name="help-circle" size={20} color="#007AFF" />
              <Text style={styles.actionText}>Report Issue</Text>
            </TouchableOpacity>
            
            {transaction.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                activeOpacity={0.7}
                onPress={() => handleCancelTransaction(transaction)}
              >
                <Ionicons name="close-circle" size={20} color="#dc2626" />
                <Text style={[styles.actionText, styles.cancelText]}>Cancel Transaction</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium'
  },
  content: {
    flex: 1
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  description: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'DMSans-Medium'
  },
  merchant: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'DMSans-Medium'
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'DMSans-Medium'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  label: {
    fontSize: 16,
    color: '#6b7280',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    fontFamily: 'DMSans-Medium'
  },
  valueMono: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  },
  actions: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 16
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    gap: 12
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'DMSans-Medium'
  },
  cancelButton: {
    backgroundColor: '#fef2f2'
  },
  cancelText: {
    color: '#dc2626'
  }
});