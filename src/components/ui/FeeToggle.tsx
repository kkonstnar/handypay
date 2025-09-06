import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FeeToggleProps {
  amount: number;
  currency: string;
  sendWithoutFees: boolean;
  onToggle: (withoutFees: boolean) => void;
}

export default function FeeToggle({ amount, currency, sendWithoutFees, onToggle }: FeeToggleProps): React.ReactElement {
  const textAnimValue = useRef(new Animated.Value(0)).current;
  const previousSendWithoutFees = useRef(sendWithoutFees);

  useEffect(() => {
    if (previousSendWithoutFees.current !== sendWithoutFees) {
      // Animate text rolling effect
      Animated.sequence([
        Animated.timing(textAnimValue, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(textAnimValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      previousSendWithoutFees.current = sendWithoutFees;
    }
  }, [sendWithoutFees, textAnimValue]);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(!sendWithoutFees);
  };

  const handleInfoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Payment Fees',
      'Payment processing fees are approximately 5%.\n\n• Customer pays fees: The customer is charged extra to cover processing fees. You receive the full amount.\n\n• You pay fees: You absorb the processing costs. You receive ~95% of the entered amount.',
      [{ text: 'Got it' }]
    );
  };

  const receivedAmount = sendWithoutFees ? amount * 0.95 : amount;
  const customerAmount = sendWithoutFees ? amount : amount / 0.95;
  
  // Format numbers with commas
  const formatAmount = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Check if the text would be too long and need wrapping
  const customerText = `They pay $${formatAmount(customerAmount)} ${currency} • You receive $${formatAmount(receivedAmount)} ${currency}`;
  const shouldWrap = customerText.length > 45; // Approximate threshold

  return (
    <TouchableOpacity
      style={styles.toggleButton}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={styles.toggleContent}>
        <Animated.View 
          style={[
            styles.titleRow,
            {
              transform: [{ translateY: textAnimValue }],
            }
          ]}
        >
          <Text style={styles.toggleTitle}>
            {sendWithoutFees ? 'You pay fees' : 'Customer pays fees'}
          </Text>
          <TouchableOpacity 
            onPress={handleInfoPress} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.infoButton}
          >
            <Ionicons name="information" size={12} color="#6b7280" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.Text 
          style={[
            styles.toggleSubtitle,
            {
              transform: [{ translateY: textAnimValue }],
            }
          ]}
        >
          {sendWithoutFees 
            ? <>You'll receive <Text style={styles.amountText}>${formatAmount(receivedAmount)} {currency}</Text></>
            : shouldWrap
              ? <>They pay <Text style={styles.amountText}>${formatAmount(customerAmount)} {currency}</Text>{'\n'}You receive <Text style={styles.amountText}>${formatAmount(receivedAmount)} {currency}</Text></>
              : <>They pay <Text style={styles.amountText}>${formatAmount(customerAmount)} {currency}</Text> • You receive <Text style={styles.amountText}>${formatAmount(receivedAmount)} {currency}</Text></>
          }
        </Animated.Text>
      </View>
      <View style={[styles.toggle, !sendWithoutFees && styles.toggleEnabled]}>
        <View style={[styles.toggleKnob, !sendWithoutFees && styles.toggleKnobEnabled]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  toggleContent: {
    flex: 1,
    overflow: 'visible',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  amountText: {
    color: '#3AB75C',
    fontWeight: '600',
  },
  toggle: {
    width: 38,
    height: 22,
    backgroundColor: '#e5e7eb',
    borderRadius: 11,
    padding: 1.5,
    justifyContent: 'center'
  },
  toggleEnabled: {
    backgroundColor: '#3AB75C'
  },
  toggleKnob: {
    width: 19,
    height: 19,
    backgroundColor: '#ffffff',
    borderRadius: 9.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2
  },
  toggleKnobEnabled: {
    transform: [{ translateX: 16 }]
  },
});