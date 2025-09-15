import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import PaymentLinkSvg from '../../../assets/paymentlink.svg';

interface HeaderProps {
  paymentUrl: string | null;
  onSharePaymentLink: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  paymentUrl,
  onSharePaymentLink,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerSpacer} />
      
      <TouchableOpacity 
        style={[
          styles.headerButton, 
          styles.greenHeaderButton, 
          !paymentUrl && styles.disabledGreenHeaderButton
        ]}
        onPress={paymentUrl ? onSharePaymentLink : undefined}
        activeOpacity={paymentUrl ? 0.7 : 1}
        disabled={!paymentUrl}
      >
        <PaymentLinkSvg width={24} height={24} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  headerSpacer: {
    width: 48,
    height: 48
  },
  greenHeaderButton: {
    backgroundColor: '#3AB75C',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3AB75C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  disabledGreenHeaderButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0
  },
});
