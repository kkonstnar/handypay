import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArrowSvg from '../../../assets/arrow.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TermsContentPageProps = NativeStackScreenProps<RootStackParamList, 'TermsContentPage'>;

export default function TermsContentPage({ navigation }: TermsContentPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
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
    <View style={[styles.container, { paddingTop: insets.top + 8 }] }>
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
        style={styles.scroll} 
        contentContainerStyle={{ paddingBottom: 140 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.contentWrap}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.date}>Updated 05/23/2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.bodyText}>
            Welcome to HandyPay ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of the HandyPay mobile application and payment services. By using our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
          </Text>

          <Text style={styles.sectionTitle}>2. Payment Services</Text>
          <Text style={styles.bodyText}>
            HandyPay provides payment processing services through Stripe Connect, enabling merchants in Jamaica to accept payments via QR codes and digital wallets. Our services are designed for micro and small businesses operating in Jamaica.
          </Text>

          <Text style={styles.sectionTitle}>3. Merchant Onboarding</Text>
          <Text style={styles.bodyText}>
            To use our payment services, you must complete Stripe's merchant onboarding process. This includes providing identification documents, business information, and bank account details as required by Jamaican financial regulations and Stripe's compliance standards.
          </Text>

          <Text style={styles.sectionTitle}>4. Payout Processing</Text>
          <Text style={styles.bodyText}>
            Payouts are processed through Stripe's payment infrastructure. Your first payout will begin processing 7 days after your account is activated and successfully verified. Subsequent payouts are typically processed within 2-5 business days, depending on your bank and the payment method used.
          </Text>

          <Text style={styles.sectionTitle}>5. Fees and Charges</Text>
          <Text style={styles.bodyText}>
            HandyPay charges a service fee for each transaction processed through our platform. Current fees are 2.9% + JMD 30 per transaction. Stripe's standard processing fees also apply. All fees are subject to change with 30 days' notice.
          </Text>

          <Text style={styles.sectionTitle}>6. Compliance and Regulations</Text>
          <Text style={styles.bodyText}>
            As a payment service provider operating in Jamaica, we comply with all applicable laws and regulations, including those set forth by the Bank of Jamaica, the Financial Services Commission, and anti-money laundering requirements. You must ensure your business activities comply with all Jamaican laws and regulations.
          </Text>

          <Text style={styles.sectionTitle}>7. Data Protection</Text>
          <Text style={styles.bodyText}>
            We collect and process personal data in accordance with our Privacy Policy and Jamaican data protection laws. Customer payment data is securely handled by Stripe and is not stored on our servers. We use industry-standard encryption and security measures to protect your information.
          </Text>

          <Text style={styles.sectionTitle}>8. Account Responsibilities</Text>
          <Text style={styles.bodyText}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during onboarding and keep your business information current.
          </Text>

          <Text style={styles.sectionTitle}>9. Prohibited Activities</Text>
          <Text style={styles.bodyText}>
            You may not use HandyPay for any illegal activities, including but not limited to money laundering, fraud, or transactions involving prohibited goods or services under Jamaican law. We reserve the right to suspend or terminate your account if we suspect prohibited activities.
          </Text>

          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.bodyText}>
            Either party may terminate this agreement at any time. Upon termination, you will remain responsible for all outstanding fees and charges. Your data will be handled in accordance with our Privacy Policy and applicable data retention laws.
          </Text>

          <Text style={styles.sectionTitle}>11. Dispute Resolution</Text>
          <Text style={styles.bodyText}>
            Any disputes arising from these Terms will be resolved through the Jamaican court system. We encourage users to contact our support team first to resolve any issues amicably.
          </Text>

          <Text style={styles.sectionTitle}>12. Updates to Terms</Text>
          <Text style={styles.bodyText}>
            We may update these Terms from time to time. Users will be notified of material changes via the app or email. Continued use of our services after changes take effect constitutes acceptance of the new Terms.
          </Text>

          <Text style={styles.sectionTitle}>13. Contact Information</Text>
          <Text style={styles.bodyText}>
            For questions about these Terms or our services, please contact us at support@tryhandypay.com or support@tryhandypay.org.
          </Text>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 56 }}>
        <Button 
          style={{ height: 48, borderRadius: 24, backgroundColor: '#3AB75C', borderColor: '#168e2c' }} 
          textStyle={{ color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'DMSans-Medium' }} 
          onPress={isScrolledToBottom ? () => navigation.goBack() : handleScrollToBottom}
        >
          {isScrolledToBottom ? (
            'Continue'
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', fontFamily: 'DMSans-Medium' }}>Scroll down</Text>
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
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,  },
  scroll: { flex: 1 },
  contentWrap: { maxWidth: 480, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', lineHeight: 32, marginBottom: 4, fontFamily: 'Coolvetica' },
  date: { color: '#64748b', marginBottom: 12, fontFamily: 'DMSans-Medium' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 24, marginBottom: 8, fontFamily: 'DMSans-SemiBold' },
  bodyText: { marginTop: 8, color: '#334155', lineHeight: 20, fontFamily: 'DMSans-Medium' },
});


