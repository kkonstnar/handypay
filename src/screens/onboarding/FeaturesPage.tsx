import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ArrowSvg from '../../../assets/arrow.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { stripeOnboardingManager } from '../../services/StripeOnboardingService';
import FeaturesSvg from '../../../assets/features.svg';

export type FeaturesPageProps = NativeStackScreenProps<RootStackParamList, 'FeaturesPage'>;

export default function FeaturesPage({ navigation }: FeaturesPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const handleNextPress = () => {
    // Start preloading Stripe onboarding link in the background
    if (user) {
      console.log('🎯 User interested in signing up - starting Stripe onboarding preload');
      stripeOnboardingManager.startPreloading(user).catch((error) => {
        console.error('❌ Error preloading Stripe onboarding:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        // Don't block navigation if preloading fails
        // The user can still proceed and onboarding will work without preload
      });
    }

    navigation.navigate('LegalPage');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }] }>
      {/* Header */}
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

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrap}>

          {/* Main headline */}
          <Text style={styles.headline}>
            Start accepting{'\n'}payments with your phone
          </Text>

          {/* Features list */}
          <View style={styles.featuresBox}>
            <FeatureItem title="No Downtime" description="Accept payments anytime, anywhere, no delays, no waiting." />

            <FeatureItem title= "No Maintenance fees" description="Keep more of what you earn with no subscription or maintenance fees." />

            <FeatureItem title="No Taxes" description="We don't collect or withhold taxes from your payments." />
          </View>

          {/* Fee disclosure */}
          <Text style={styles.feeDisclosure}>
            We only charge 5% per transaction. You can choose to pay the fees yourself or have your customers pay them.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.fixedBottom}>
        <Button style={styles.cta} textStyle={styles.ctaText} onPress={handleNextPress}>
          Next
        </Button>
      </View>
    </View>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }): React.ReactElement {
  // Check if title starts with "0" and split it for special styling
  const renderTitle = () => {
    if (title.startsWith('No')) {
      return (
        <Text style={styles.featureTitle}>
          <Text style={styles.zero}>0</Text>
          <Text>{title.substring(2)}</Text>
        </Text>
      );
    }
    return <Text style={styles.featureTitle}>{title}</Text>;
  };

  return (
    <View style={styles.featureItem}>
      <FeaturesSvg width={28} height={28} />
      <View style={{ flex: 1 }}>
        {renderTitle()}
        <Text style={styles.featureDesc}>{description}</Text>
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
  brand: { color: '#3AB75C', fontSize: 32, marginBottom: 16, fontFamily: 'Coolvetica' },
  headline: { fontSize: 32, fontWeight: '700', color: '#111827', lineHeight: 36, marginBottom: 24, fontFamily: 'Coolvetica', letterSpacing: -1 },
  featuresBox: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', columnGap: 8, paddingVertical: 8 },
  zero: { color: '#3AB75C', fontSize: 24, fontWeight: '700', marginLeft: 6, marginRight: 8, lineHeight: 28, fontFamily: 'DMSans-SemiBold' },
  featureTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'DMSans-SemiBold', color: '#111827', marginBottom: 6 },
  featureDesc: { color: '#4b5563', lineHeight: 22, fontSize: 16, fontFamily: 'DMSans-Medium' },
  fixedBottom: { position: 'absolute', left: 24, right: 24, bottom: 56 },
  cta: { height: 48, borderRadius: 24, backgroundColor: '#3AB75C', borderColor: '#3AB75C' },
  ctaText: { color: '#ffffff', fontSize: 16, fontWeight: '500', fontFamily: 'DMSans-Medium' },
  feeDisclosure: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    marginTop: 16,
    lineHeight: 20,
    fontFamily: 'DMSans-Medium',
    paddingHorizontal: 8
  },
});


