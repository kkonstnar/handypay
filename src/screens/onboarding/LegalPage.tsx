import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArrowSvg from '../../../assets/arrow.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LegalPageProps = NativeStackScreenProps<RootStackParamList, 'LegalPage'>;

export default function LegalPage({ navigation }: LegalPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  
  // Simple approach: Set flags when navigating to privacy/terms pages
  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPage');
    // Set flag when user attempts to read privacy
    setTimeout(() => setHasReadPrivacy(true), 100);
  };

  const handleTermsPress = () => {
    navigation.navigate('TermsContentPage');
    // Set flag when user attempts to read terms
    setTimeout(() => setHasReadTerms(true), 100);
  };

  const canContinue = hasReadPrivacy && hasReadTerms;
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrap}>
          <Text style={styles.headline}>Legal</Text>
          <Text style={styles.subText}>We want to ensure you're well-informed about our policies.</Text>

          <View style={styles.policyBox}>
            <View style={styles.policyRow}>
              <View style={styles.policyLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="document-text-outline" size={24} color="#111827" />
                </View>
                <Text style={styles.policyLabel}>Privacy policy</Text>
              </View>
              <Button 
                variant="secondary" 
                size="sm" 
                style={[styles.readBtn, hasReadPrivacy && styles.readBtnCompleted]} 
                textStyle={[styles.readBtnText, hasReadPrivacy && styles.readBtnTextCompleted]} 
                onPress={handlePrivacyPress}
              >
                Read
              </Button>
            </View>

            <View style={styles.divider} />

            <View style={styles.policyRow}>
              <View style={styles.policyLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="document-text-outline" size={24} color="#111827" />
                </View>
                <Text style={styles.policyLabel}>Terms of service</Text>
              </View>
              <Button 
                variant="secondary" 
                size="sm" 
                style={[styles.readBtn, hasReadTerms && styles.readBtnCompleted]} 
                textStyle={[styles.readBtnText, hasReadTerms && styles.readBtnTextCompleted]} 
                onPress={handleTermsPress}
              >
                Read
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.fixedBottom}>
        <Button 
          style={[styles.cta, !canContinue && styles.ctaDisabled]} 
          textStyle={[styles.ctaText, !canContinue && styles.ctaTextDisabled]} 
          disabled={!canContinue}
          onPress={() => navigation.navigate('GetStartedPage')}
        >
          Confirm & continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 96 },
  contentWrap: { maxWidth: 480, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },
  headline: { fontSize: 32, fontWeight: '800', color: '#111827', lineHeight: 36, marginBottom: 8, fontFamily: 'Coolvetica' },
  subText: { color: '#4b5563', marginBottom: 16, fontFamily: 'DMSans-Medium' },
  policyBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, overflow: 'hidden' },
  policyRow: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  policyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 2,
    elevation: 2,
  },
  policyLabel: { fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'DMSans-Medium', letterSpacing: -0.5 },
  divider: { height: 1, backgroundColor: '#e5e7eb' },
  readBtn: { backgroundColor: '#f3f4f6', borderColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 8 },
  readBtnText: { fontSize: 16, color: '#374151', fontFamily: 'DMSans-Medium', letterSpacing: -0.5 },
  readBtnCompleted: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
  readBtnTextCompleted: { color: '#3AB75C', fontFamily: 'DMSans-Medium' },
  fixedBottom: { position: 'absolute', left: 24, right: 24, bottom: 56 },
  cta: { height: 48, borderRadius: 24, backgroundColor: '#3AB75C', borderColor: '#3AB75C' },
  ctaText: { color: '#ffffff', fontSize: 16, fontWeight: '500', fontFamily: 'DMSans-Medium' },
  ctaDisabled: { backgroundColor: '#e5e7eb', borderColor: '#e5e7eb' },
  ctaTextDisabled: { color: '#9ca3af', fontFamily: 'DMSans-Medium' },
});


