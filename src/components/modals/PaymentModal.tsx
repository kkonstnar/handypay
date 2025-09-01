import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import PaymentLinkSvg from '../../../assets/paymentlink.svg';

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  currency: string;
  onClose: () => void;
  onQRPress: () => void;
  onPaymentLinkPress: () => void;
}

export default function PaymentModal({ 
  visible, 
  amount, 
  currency, 
  onClose, 
  onQRPress, 
  onPaymentLinkPress 
}: PaymentModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Real-time, quick and secure payments</Text>
          <Text style={styles.subtitle}>
            Let customers pay by scanning your QR code or through a secure link.
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onQRPress();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <Svg width={24} height={24 * 18/21} viewBox="0 0 21 18" fill="none">
                  <Path d="M18.9965 12.2725C18.5884 12.2725 18.1802 12.5793 18.1802 13.0907V15.1361C18.1802 15.852 17.5679 16.3634 16.9557 16.3634H14.9149C14.5067 16.3634 14.0986 16.6702 14.0986 17.1816C14.0986 17.6929 14.4047 17.9998 14.9149 17.9998H16.9557C18.4863 17.9998 19.8128 16.7725 19.8128 15.1361V13.0907C19.8128 12.6816 19.4047 12.2725 18.9965 12.2725Z" fill="#ffffff"/>
                  <Path d="M14.9149 1.63637H16.9557C17.67 1.63637 18.1802 2.25 18.1802 2.86364V4.90909C18.1802 5.31818 18.4864 5.72727 18.9966 5.72727C19.5068 5.72727 19.8129 5.42046 19.8129 4.90909V2.86364C19.8129 1.32955 18.5884 0 16.9557 0H14.9149C14.5068 0 14.0986 0.30682 14.0986 0.81818C14.0986 1.32955 14.5068 1.63637 14.9149 1.63637Z" fill="#ffffff"/>
                  <Path d="M6.75147 16.3634H4.71066C3.99637 16.3634 3.48617 15.7498 3.48617 15.1361V13.0907C3.48617 12.6816 3.18005 12.2725 2.66984 12.2725C2.15964 12.2725 1.85352 12.6816 1.85352 13.0907V15.1361C1.85352 16.6702 3.07801 17.9998 4.71066 17.9998H6.75147C7.15964 17.9998 7.5678 17.6929 7.5678 17.1816C7.5678 16.6702 7.15964 16.3634 6.75147 16.3634Z" fill="#ffffff"/>
                  <Path d="M2.66984 5.72727C3.07801 5.72727 3.48617 5.42046 3.48617 4.90909V2.86364C3.48617 2.14773 4.09842 1.63637 4.71066 1.63637H6.75148C7.15964 1.63637 7.5678 1.32955 7.5678 0.81818C7.5678 0.30682 7.15964 0 6.75148 0H4.71066C3.18005 0 1.85352 1.32955 1.85352 2.86364V4.90909C1.85352 5.31818 2.26168 5.72727 2.66984 5.72727Z" fill="#ffffff"/>
                  <Path d="M14.915 15.1363C16.0375 15.1363 16.9559 14.2159 16.9559 13.0909V11.25H4.71094V13.0909C4.71094 14.2159 5.62931 15.1363 6.75176 15.1363H14.915Z" fill="#ffffff"/>
                  <Path d="M20.0167 8.18143H16.9555V4.90873C16.9555 3.78373 16.0371 2.86328 14.9146 2.86328H6.75138C5.62893 2.86328 4.71056 3.78373 4.71056 4.90873V8.38603H1.64934C1.24117 8.38603 0.833008 8.69283 0.833008 9.20423C0.833008 9.71553 1.13913 10.0223 1.64934 10.0223H20.0167C20.4248 10.0223 20.833 9.71553 20.833 9.20423C20.833 8.69283 20.4248 8.18143 20.0167 8.18143Z" fill="#ffffff"/>
                </Svg>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Scan to pay</Text>
                <Text style={styles.optionDescription}>Let customers scan your QR code to pay instantly.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#111827" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, styles.lastOptionButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPaymentLinkPress();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <PaymentLinkSvg width={24} height={24} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Send a payment link</Text>
                <Text style={styles.optionDescription}>Share a secure link so customers can pay online.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -1,
    fontFamily: 'DMSans-SemiBold'
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'DMSans-Medium'
  },
  optionsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff'
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'DMSans-Medium'
  },
  lastOptionButton: {
    borderBottomWidth: 0
  }
});