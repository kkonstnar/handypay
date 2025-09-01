import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type PaymentErrorProps = NativeStackScreenProps<RootStackParamList, 'PaymentError'>;

export default function PaymentError({ navigation }: PaymentErrorProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  const handleReportIssue = () => {
    // TODO: Implement report issue functionality
    console.log('Report issue tapped');
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeTabs' }],
    });
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeTabs' }],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={handleContinue}>
          <Ionicons name="close" size={24} color="#111827" />
        </Button>
      </View>

      <View style={styles.centerWrap}>
        <View style={styles.errorIcon}>
          <Ionicons name="close" size={32} color="#dc2626" />
        </View>
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.subtitle}>Something went wrong with your transaction. Please try again or report the issue.</Text>
      </View>

      <View style={styles.bottomButtons}>
        <Button 
          style={styles.reportBtn} 
          textStyle={styles.reportBtnText} 
          onPress={handleReportIssue}
        >
          <Ionicons name="flag-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          Report Issue
        </Button>
        <Button 
          variant="outline" 
          style={styles.continueBtn} 
          textStyle={styles.continueBtnText} 
          onPress={handleContinue}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    justifyContent: 'space-between'
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8
  },
  centerWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  title: { 
    marginTop: 16, 
    fontSize: 28, 
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'DMSans-SemiBold',
    letterSpacing: -1
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24
  },
  bottomButtons: { 
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12
  },
  reportBtn: { 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#dc2626', 
    borderColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  reportBtnText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  continueBtn: {
    height: 48,
    borderRadius: 24,
    borderColor: '#e5e7eb'
  },
  continueBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
});