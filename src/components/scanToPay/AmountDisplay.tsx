import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDisplayAmount } from '../../utils/paymentUtils';

interface AmountDisplayProps {
  amount: number;
  currency: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency,
}) => {
  return (
    <View style={styles.amountSection}>
      <Text style={styles.amount}>${formatDisplayAmount(amount)}</Text>
      <Text style={styles.currency}>{currency.toLowerCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
