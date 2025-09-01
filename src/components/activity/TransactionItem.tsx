import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../contexts/TransactionContext';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, onPress }: TransactionItemProps): React.ReactElement {
  const isPending = transaction.status === 'pending';
  const isCancelled = transaction.status === 'cancelled';
  
  console.log(`Transaction ${transaction.id} status: ${transaction.status}, isCancelled: ${isCancelled}`);
  
  // Amount color logic
  const amountColor = isCancelled ? '#6b7280' : (isPending ? '#9ca3af' : '#111827');
  
  // Text style for cancelled transactions
  const textStyle = isCancelled ? { textDecorationLine: 'line-through' as const } : {};
  
  // QR Code Icon (Home Tab Icon)
  const QRCodeIcon = () => (
    <Svg width={21} height={18} viewBox="0 0 21 18" fill="none">
      <Path d="M18.9965 12.2725C18.5884 12.2725 18.1802 12.5793 18.1802 13.0907V15.1361C18.1802 15.852 17.5679 16.3634 16.9557 16.3634H14.9149C14.5067 16.3634 14.0986 16.6702 14.0986 17.1816C14.0986 17.6929 14.4047 17.9998 14.9149 17.9998H16.9557C18.4863 17.9998 19.8128 16.7725 19.8128 15.1361V13.0907C19.8128 12.6816 19.4047 12.2725 18.9965 12.2725Z" fill="#3AB75C"/>
      <Path d="M14.9149 1.63637H16.9557C17.67 1.63637 18.1802 2.25 18.1802 2.86364V4.90909C18.1802 5.31818 18.4864 5.72727 18.9966 5.72727C19.5068 5.72727 19.8129 5.42046 19.8129 4.90909V2.86364C19.8129 1.32955 18.5884 0 16.9557 0H14.9149C14.5068 0 14.0986 0.30682 14.0986 0.81818C14.0986 1.32955 14.5068 1.63637 14.9149 1.63637Z" fill="#3AB75C"/>
      <Path d="M6.75147 16.3634H4.71066C3.99637 16.3634 3.48617 15.7498 3.48617 15.1361V13.0907C3.48617 12.6816 3.18005 12.2725 2.66984 12.2725C2.15964 12.2725 1.85352 12.6816 1.85352 13.0907V15.1361C1.85352 16.6702 3.07801 17.9998 4.71066 17.9998H6.75147C7.15964 17.9998 7.5678 17.6929 7.5678 17.1816C7.5678 16.6702 7.15964 16.3634 6.75147 16.3634Z" fill="#3AB75C"/>
      <Path d="M2.66984 5.72727C3.07801 5.72727 3.48617 5.42046 3.48617 4.90909V2.86364C3.48617 2.14773 4.09842 1.63637 4.71066 1.63637H6.75148C7.15964 1.63637 7.5678 1.32955 7.5678 0.81818C7.5678 0.30682 7.15964 0 6.75148 0H4.71066C3.18005 0 1.85352 1.32955 1.85352 2.86364V4.90909C1.85352 5.31818 2.26168 5.72727 2.66984 5.72727Z" fill="#3AB75C"/>
      <Path d="M14.915 15.1363C16.0375 15.1363 16.9559 14.2159 16.9559 13.0909V11.25H4.71094V13.0909C4.71094 14.2159 5.62931 15.1363 6.75176 15.1363H14.915Z" fill="#3AB75C"/>
      <Path d="M20.0167 8.18143H16.9555V4.90873C16.9555 3.78373 16.0371 2.86328 14.9146 2.86328H6.75138C5.62893 2.86328 4.71056 3.78373 4.71056 4.90873V8.38603H1.64934C1.24117 8.38603 0.833008 8.69283 0.833008 9.20423C0.833008 9.71553 1.13913 10.0223 1.64934 10.0223H20.0167C20.4248 10.0223 20.833 9.71553 20.833 9.20423C20.833 8.69283 20.4248 8.18143 20.0167 8.18143Z" fill="#3AB75C"/>
    </Svg>
  );
  
  // Payment Link Icon
  const PaymentLinkIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_498_12900)">
        <Path d="M12.918 16.5898L9.24585 20.262C9.24585 20.262 9.24585 20.2621 9.24576 20.2621C9.24576 20.2621 9.24576 20.2621 9.24568 20.2621C7.72715 21.7808 5.25616 21.7808 3.73746 20.2621C3.00174 19.5264 2.59666 18.5483 2.59666 17.5079C2.59666 16.4677 3.00174 15.4897 3.7372 14.754C3.73729 14.7539 3.73738 14.7538 3.73746 14.7538L7.40958 11.0816C7.91653 10.5745 7.91653 9.75241 7.40949 9.24545C6.90253 8.7385 6.08043 8.7385 5.57339 9.24545L1.90128 12.9177C1.90102 12.9179 1.90076 12.9183 1.9005 12.9185C0.674959 14.1445 0 15.7744 0 17.5079C0 19.2419 0.675219 20.8721 1.90136 22.0982C3.16698 23.3638 4.82927 23.9966 6.49166 23.9966C8.15404 23.9966 9.81642 23.3638 11.0819 22.0982C11.082 22.0982 11.082 22.0981 11.082 22.0981L14.7541 18.4259C15.261 17.9189 15.261 17.0968 14.754 16.5898C14.2471 16.0828 13.4251 16.0828 12.918 16.5898Z" fill="#3AB75C"/>
        <Path d="M23.9998 6.49148C23.9998 4.75752 23.3245 3.12733 22.0984 1.90119C19.5673 -0.629866 15.4489 -0.62978 12.9179 1.90119C12.9178 1.90136 12.9176 1.90145 12.9175 1.90162L9.24552 5.57356C8.73847 6.08052 8.73847 6.90271 9.24552 7.40966C9.49912 7.66327 9.83132 7.78999 10.1636 7.78999C10.4958 7.78999 10.8282 7.66318 11.0816 7.40966L14.7536 3.73772C14.7537 3.73755 14.7539 3.73746 14.7541 3.73729C16.2726 2.21876 18.7436 2.21867 20.2623 3.73729C20.9979 4.47301 21.4032 5.45117 21.4032 6.49148C21.4032 7.5317 20.9981 8.50969 20.2625 9.24541L20.2623 9.24568L16.5902 12.9179C16.0832 13.4248 16.0832 14.2469 16.5903 14.754C16.8438 15.0075 17.1761 15.1343 17.5083 15.1343C17.8406 15.1343 18.1728 15.0075 18.4264 14.754L22.0985 11.0818C22.0987 11.0815 22.099 11.0812 22.0993 11.0809C23.3248 9.85494 23.9998 8.22501 23.9998 6.49148Z" fill="#3AB75C"/>
        <Path d="M7.40958 16.59C7.6631 16.8435 7.99538 16.9703 8.32758 16.9703C8.65987 16.9703 8.99216 16.8435 9.24568 16.59L16.5901 9.24561C17.0971 8.73866 17.0971 7.91655 16.5901 7.40951C16.0831 6.90256 15.261 6.90256 14.754 7.40951L7.40958 14.7538C6.90254 15.261 6.90254 16.0831 7.40958 16.59Z" fill="#3AB75C"/>
      </G>
      <Defs>
        <ClipPath id="clip0_498_12900">
          <Rect width="24" height="24" fill="white"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
  
  // Determine icon based on payment method
  const getPaymentIcon = () => {
    // Use home icon for QR code payments and QR-generated payment links
    if (transaction.type === 'qr_payment' || transaction.paymentMethod === 'qr_code') {
      return <QRCodeIcon />;
    } else {
      return <PaymentLinkIcon />;
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.transactionItem}
      activeOpacity={0.7}
      onPress={() => onPress(transaction)}
    >
      <View style={styles.transactionIcon}>
        {getPaymentIcon()}
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={[styles.transactionTitle, textStyle]}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionTime}>
          {transaction.date.toLocaleDateString('en-US', { 
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
          })}, {transaction.date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </Text>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: amountColor },
          textStyle
        ]}>
          ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  transactionDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  transactionTime: {
    fontSize: 14,
    color: '#6b7280',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Pro-Rounded-Regular'
  }
});