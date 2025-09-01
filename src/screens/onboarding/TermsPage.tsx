import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TermsPageProps = NativeStackScreenProps<RootStackParamList, 'LegalPage'>;

export default function TermsPage({ navigation }: TermsPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }] }>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigation.navigate('FeaturesPage')}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Button>
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrap}>
          <Text style={styles.headline}>Legal</Text>
          <Text style={styles.subText}>We want to ensure you're well-informed about our policies.</Text>

          {/* Policy items */}
          <View style={styles.policyBox}>
            {/* Privacy Policy */}
            <View style={styles.policyRow}>
              <View style={styles.policyLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="document-text-outline" size={24} color="#111827" />
                </View>
                <Text style={styles.policyLabel}>Privacy policy</Text>
              </View>
              <Button variant="secondary" size="sm" style={styles.readBtn} textStyle={styles.readBtnText} onPress={() => navigation.navigate('PrivacyPage')}>
                Read
              </Button>
            </View>

            <View style={styles.divider} />

            {/* Terms of Service */}
            <View style={styles.policyRow}>
              <View style={styles.policyLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="document-text-outline" size={24} color="#111827" />
                </View>
                <Text style={styles.policyLabel}>Terms of service</Text>
              </View>
              <Button variant="secondary" size="sm" style={styles.readBtn} textStyle={styles.readBtnText} onPress={() => navigation.navigate('TermsContentPage')}>
                Read
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.fixedBottom}>
        <Button style={styles.cta} textStyle={styles.ctaText} onPress={() => navigation.replace('HomeTabs')}>
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
  subText: { color: '#4b5563', marginBottom: 16, fontFamily: 'DMSans_18pt-Regular' },
  policyBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, overflow: 'hidden' },
  policyRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  policyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyLabel: { fontSize: 18, fontWeight: '600', color: '#111827', fontFamily: 'DMSans_18pt-Regular' },
  divider: { height: 1, backgroundColor: '#e5e7eb' },
  readBtn: { backgroundColor: '#f3f4f6', borderColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 8 },
  readBtnText: { fontSize: 16, color: '#374151', fontFamily: 'DMSans_18pt-Regular' },
  fixedBottom: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  cta: { height: 48, borderRadius: 24, backgroundColor: '#3AB75C', borderColor: '#3AB75C' },
  ctaText: { color: '#ffffff', fontSize: 16, fontWeight: '500', fontFamily: 'DMSans_18pt-Regular' },
});


