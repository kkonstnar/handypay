import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArrowSvg from '../../../assets/arrow.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PrivacyPageProps = NativeStackScreenProps<RootStackParamList, 'PrivacyPage'>;

export default function PrivacyPage({ navigation }: PrivacyPageProps): React.ReactElement {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
    setIsScrolledToBottom(isAtBottom);
  };

  const handleScrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Button 
          variant="ghost" 
          size="icon" 
          onPress={() => navigation.goBack()} 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ArrowSvg width={24} height={24} />
        </Button>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 140 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.date}>05/23/2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.bodyText}>
            At HandyPay, we are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our mobile payment application and services.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.bodyText}>
            We collect information you provide directly, such as your name, email address, phone number, and business information during account registration. We also collect authentication data through Apple Sign-In, including your user ID and profile information.
          </Text>

          <Text style={styles.sectionTitle}>3. Payment Information</Text>
          <Text style={styles.bodyText}>
            Payment data is processed securely through Stripe and is not stored on our servers. We do not have access to your full credit card numbers, bank account details, or payment credentials. Stripe handles all payment processing in compliance with PCI DSS standards.
          </Text>

          <Text style={styles.sectionTitle}>4. Transaction Data</Text>
          <Text style={styles.bodyText}>
            We collect transaction information including amounts, timestamps, and merchant details for your payment history and receipts. This data helps us provide transaction records and improve our services.
          </Text>

          <Text style={styles.sectionTitle}>5. Device and Usage Information</Text>
          <Text style={styles.bodyText}>
            We collect information about your device, including device type, operating system, app version, and usage patterns. This helps us optimize the app performance and provide technical support.
          </Text>

          <Text style={styles.sectionTitle}>6. How We Use Your Information</Text>
          <Text style={styles.bodyText}>
            We use your information to:
          </Text>
          <Text style={styles.bulletPoint}>• Process payments and manage your account</Text>
          <Text style={styles.bulletPoint}>• Provide customer support and technical assistance</Text>
          <Text style={styles.bulletPoint}>• Send transaction notifications and receipts</Text>
          <Text style={styles.bulletPoint}>• Improve our app and develop new features</Text>
          <Text style={styles.bulletPoint}>• Comply with legal and regulatory requirements</Text>
          <Text style={styles.bulletPoint}>• Prevent fraud and ensure platform security</Text>

          <Text style={styles.sectionTitle}>7. Information Sharing</Text>
          <Text style={styles.bodyText}>
            We do not sell or rent your personal information to third parties. We may share information with:
          </Text>
          <Text style={styles.bulletPoint}>• Stripe for payment processing</Text>
          <Text style={styles.bulletPoint}>• Financial institutions for payout processing</Text>
          <Text style={styles.bulletPoint}>• Law enforcement when required by law</Text>
          <Text style={styles.bulletPoint}>• Service providers who assist our operations</Text>

          <Text style={styles.sectionTitle}>8. Data Security</Text>
          <Text style={styles.bodyText}>
            We implement industry-standard security measures including encryption, secure servers, and regular security audits. Your payment information is protected by Stripe's advanced security systems. We use secure connections (HTTPS) for all data transmission.
          </Text>

          <Text style={styles.sectionTitle}>9. Data Retention</Text>
          <Text style={styles.bodyText}>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Transaction records are typically retained for 7 years as required by Jamaican financial regulations. You can request deletion of your account data at any time.
          </Text>

          <Text style={styles.sectionTitle}>10. Your Rights</Text>
          <Text style={styles.bodyText}>
            Under Jamaican data protection laws, you have the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Access your personal information</Text>
          <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
          <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
          <Text style={styles.bulletPoint}>• Object to processing of your information</Text>
          <Text style={styles.bulletPoint}>• Request data portability</Text>

          <Text style={styles.sectionTitle}>11. Cookies and Tracking</Text>
          <Text style={styles.bodyText}>
            Our mobile app may use cookies and similar technologies to improve user experience and analyze app usage. You can manage cookie preferences through your device settings.
          </Text>

          <Text style={styles.sectionTitle}>12. International Data Transfers</Text>
          <Text style={styles.bodyText}>
            Your data may be transferred to and processed in countries other than Jamaica, including the United States for Stripe's services. We ensure appropriate safeguards are in place for such transfers.
          </Text>

          <Text style={styles.sectionTitle}>13. Children's Privacy</Text>
          <Text style={styles.bodyText}>
            Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
          </Text>

          <Text style={styles.sectionTitle}>14. Changes to This Policy</Text>
          <Text style={styles.bodyText}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes via the app or email. Your continued use of our services after changes take effect constitutes acceptance of the updated policy.
          </Text>

          <Text style={styles.sectionTitle}>15. Contact Us</Text>
          <Text style={styles.bodyText}>
            If you have questions about this Privacy Policy or our data practices, please contact us at privacy@handypay.com or support@tryhandypay.org.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.floatingButton}>
        <Button 
          style={styles.actionButton} 
          onPress={isScrolledToBottom ? () => navigation.goBack() : handleScrollToBottom}
        >
          {isScrolledToBottom ? (
            <Text style={styles.actionButtonText}>Continue</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.actionButtonText}>Scroll down</Text>
              <Ionicons name="chevron-down" size={20} color="white" style={{ marginLeft: 8 }} />
            </View>
          )}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 16 },
  scrollView: { flex: 1 },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', fontFamily: 'Coolvetica' },
  date: { marginTop: 4, color: '#64748b', fontFamily: 'DMSans-Medium' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 24, marginBottom: 8, fontFamily: 'DMSans-SemiBold' },
  bodyText: { marginTop: 8, color: '#334155', lineHeight: 20, fontFamily: 'DMSans-Medium' },
  bulletPoint: { marginTop: 4, marginLeft: 16, color: '#334155', lineHeight: 18, fontFamily: 'DMSans-Medium' },
  floatingButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 56,
  },
  actionButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    borderColor: '#3AB75C',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'DMSans-Medium',
  },
});
