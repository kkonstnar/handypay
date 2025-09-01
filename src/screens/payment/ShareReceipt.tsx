import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, Alert, TextInput, Modal, TouchableOpacity } from 'react-native';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MastercardSvg from '../../../assets/mastercard.svg';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export type ShareReceiptProps = NativeStackScreenProps<RootStackParamList, 'ShareReceipt'>;

export default function ShareReceipt({ navigation, route }: ShareReceiptProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const receiptRef = useRef<View>(null);
  
  // Get amount and currency from params or defaults
  const amount = route.params?.amount || 10000.00;
  const currency = route.params?.currency || 'JMD';
  
  // State for editable fields and modals
  const [description, setDescription] = useState('Receipt from Kyle Campbell');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  
  const handleClose = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeTabs' }],
    });
  };

  const handleDownload = async () => {
    if (description.trim() === '') {
      Alert.alert('Description Required', 'Please add a description before downloading the receipt.');
      return;
    }
    
    try {
      const htmlContent = await generateReceiptPDF();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Receipt',
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    }
  };

  const generateReceiptPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; margin: 0; }
            .amount { font-size: 48px; font-weight: 700; color: #111827; margin-bottom: 8px; }
            .transaction-type { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 4px; }
            .timestamp { font-size: 16px; color: #6b7280; margin-bottom: 32px; }
            .section { margin-bottom: 24px; }
            .row { display: flex; justify-content: space-between; align-items: center; }
            .label { font-size: 16px; color: #6b7280; font-weight: 500; }
            .approved-badge { background-color: #3AB75C; padding: 8px 16px; border-radius: 20px; color: white; font-size: 14px; font-weight: 600; }
            .section-title { font-size: 16px; color: #6b7280; font-weight: 500; margin-bottom: 12px; }
            .description { font-size: 18px; color: #111827; font-weight: 600; }
            .payment-method { display: flex; align-items: center; gap: 12px; }
            .card-info { font-size: 16px; color: #111827; font-weight: 500; }
            .transaction-id { font-size: 16px; color: #111827; font-weight: 500; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="amount">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}</div>
          <div class="transaction-type">Card purchase</div>
          <div class="timestamp">Fri, Jan 12, 7:30 PM</div>
          
          <div class="section">
            <div class="row">
              <span class="label">Status</span>
              <span class="approved-badge">Approved</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Description</div>
            <div class="description">${description}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Payment method</div>
            <div class="payment-method">
              <svg width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 12px;">
                <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" fill="white"/>
                <rect x="0.5" y="0.5" width="33" height="23" rx="3.5" stroke="#F2F4F7"/>
                <path d="M21.5771 5.02997C25.322 5.02997 28.3584 8.02986 28.3584 11.7302C28.3583 15.4304 25.322 18.4304 21.5771 18.4304C19.8982 18.4303 18.3629 17.8256 17.1787 16.8268C15.9945 17.8254 14.4591 18.4304 12.7803 18.4304C9.03566 18.4301 6.00011 15.4302 6 11.7302C6 8.02999 9.03559 5.03019 12.7803 5.02997C14.459 5.02997 15.9945 5.63405 17.1787 6.63251C18.3629 5.63391 19.8983 5.03 21.5771 5.02997Z" fill="#ED0006"/>
                <path d="M21.5781 5.02997C25.3229 5.03005 28.3584 8.02991 28.3584 11.7302C28.3583 15.4303 25.3229 18.4303 21.5781 18.4304C19.8992 18.4304 18.3639 17.8255 17.1797 16.8268C18.6368 15.598 19.5624 13.7714 19.5625 11.7302C19.5625 9.68867 18.6371 7.8614 17.1797 6.63251C18.3639 5.63397 19.8993 5.02997 21.5781 5.02997Z" fill="#F9A000"/>
                <path d="M17.1787 6.63251C18.6363 7.86141 19.5615 9.68853 19.5615 11.7302C19.5615 13.7716 18.636 15.598 17.1787 16.8268C15.7217 15.598 14.7969 13.7713 14.7969 11.7302C14.7969 9.68882 15.7215 7.8614 17.1787 6.63251Z" fill="#FF5E00"/>
              </svg>
              <span class="card-info">Mastercard ending **** 3040</span>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Transaction ID</div>
            <div class="transaction-id">6B29FC40CA47-1067B31D-00DD010662DA</div>
          </div>
        </body>
      </html>
    `;
    
    return htmlContent;
  };

  const handleShare = async () => {
    if (description.trim() === '') {
      Alert.alert('Description Required', 'Please add a description before sharing the receipt.');
      return;
    }
    
    try {
      const htmlContent = await generateReceiptPDF();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Receipt',
      });
      
      // Navigate back to home after sharing
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' }],
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  };

  const handleEmailReceipt = () => {
    if (description.trim() === '') {
      Alert.alert('Description Required', 'Please add a description before emailing the receipt.');
      return;
    }
    setShowEmailModal(true);
  };

  const sendEmailReceipt = () => {
    if (emailAddress.trim() === '') {
      Alert.alert('Email Required', 'Please enter an email address.');
      return;
    }
    
    // TODO: Implement email sending
    console.log('Email receipt to:', emailAddress, 'with description:', description);
    setShowEmailModal(false);
    setEmailAddress('');
    Alert.alert('Email Sent', `Receipt has been sent to ${emailAddress}`);
  };

  const handleReportIssue = () => {
    navigation.navigate({ name: 'PaymentError', params: { amount, currency } });
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={handleClose}>
          <Ionicons name="close" size={24} color="#111827" />
        </Button>
        <View style={styles.receiptIcon}>
          <Ionicons name="receipt" size={20} color="#ffffff" />
        </View>
      </View>

      <View ref={receiptRef} style={styles.receiptContainer}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amount}>${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.currency}>{currency}</Text>
        </View>
        
        {/* Transaction Type */}
        <Text style={styles.transactionType}>Card purchase</Text>
        <Text style={styles.timestamp}>Fri, Jan 12, 7:30 PM</Text>

        {/* Status and Receipt Section */}
        <View style={styles.combinedFieldContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>Approved</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Receipt</Text>
            <View style={styles.receiptActions}>
              <Button 
                variant="ghost" 
                style={styles.actionBtn}
                textStyle={styles.downloadText}
                onPress={handleDownload}
              >
                <Ionicons name="download" size={16} color="#007AFF" style={{ marginRight: 4 }} />
                Download
              </Button>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.fieldContainer}>
            <Text style={styles.description}>POS purchase - Kaya Herb House</Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={[styles.fieldContainer, styles.paymentMethodContainer]}>
            <View style={styles.paymentMethod}>
              <MastercardSvg width={34} height={24} />
              <Text style={styles.cardInfo}>Mastercard ending **** 3040</Text>
            </View>
          </View>
        </View>

        {/* Transaction ID Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction ID</Text>
          <View style={styles.fieldContainer}>
            <Text style={styles.transactionId}>6B29FC40CA47-1067B31D-00DD010662DA</Text>
          </View>
        </View>

        {/* Report an Issue */}
        <View style={styles.reportContainer}>
          <TouchableOpacity 
            style={styles.reportBtn}
            onPress={handleReportIssue}
            activeOpacity={0.7}
          >
            <View style={styles.reportRow}>
              <Text style={styles.reportText}>Report an Issue</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <Button 
          style={styles.emailBtn} 
          textStyle={styles.emailBtnText} 
          onPress={handleShare}
        >
          Share receipt
        </Button>
      </View>

      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Button variant="ghost" onPress={() => setShowEmailModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Button>
            <Text style={styles.modalTitle}>Email Receipt</Text>
            <Button variant="ghost" onPress={sendEmailReceipt}>
              <Text style={styles.sendText}>Send</Text>
            </Button>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.emailLabel}>Email Address</Text>
            <TextInput
              style={styles.emailInput}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3AB75C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    paddingHorizontal: 24
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  currency: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase'
  },
  transactionType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  timestamp: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32
  },
  section: {
    marginBottom: 24
  },
  fieldContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  combinedFieldContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16
  },
  paymentMethodContainer: {
    paddingVertical: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500'
  },
  approvedBadge: {
    backgroundColor: '#3AB75C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  approvedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 12
  },
  description: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600'
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  cardInfo: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500'
  },
  transactionId: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'monospace'
  },
  reportBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  reportText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500'
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  emailBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    borderColor: '#3AB75C'
  },
  emailBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  receiptContainer: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 140
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 16
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  editBtn: {
    padding: 4
  },
  editText: {
    color: '#007AFF',
    fontSize: 14
  },
  editContainer: {
    marginTop: 12
  },
  reportContainer: {
    marginBottom: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    height: 32,
    borderRadius: 16
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16
  },
  sendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  modalContent: {
    padding: 16
  },
  emailLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#111827'
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  }
});