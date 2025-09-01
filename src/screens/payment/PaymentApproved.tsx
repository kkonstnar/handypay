import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SuccessSvg from '../../../assets/success.svg';
import { Ionicons } from '@expo/vector-icons';

export type PaymentApprovedProps = NativeStackScreenProps<RootStackParamList, 'PaymentApproved'>;

export default function PaymentApproved({ navigation, route }: PaymentApprovedProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  
  // Get amount and currency from params or defaults
  const amount = route.params?.amount || 0;
  const currency = route.params?.currency || 'JMD';

  const handleShareReceipt = () => {
    navigation.navigate('ShareReceipt', { amount, currency });
  };

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeTabs' }],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={handleDone}>
          <Ionicons name="close" size={24} color="#111827" />
        </Button>
      </View>

      <View style={styles.centerWrap}>
        <SuccessSvg width={48} height={48} />
        <Text style={styles.title}>Payment Approved</Text>
        <Text style={styles.subtitle}>Your transaction has been completed successfully</Text>
      </View>

      <View style={styles.bottomButtons}>
        {/* <Button 
          style={styles.shareBtn} 
          textStyle={styles.shareBtnText} 
          onPress={handleShareReceipt}
        >
          <Ionicons name="share-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          Share Receipt
        </Button> */}
        <Button 
          style={styles.shareBtn} 
          textStyle={styles.shareBtnText} 
          onPress={handleDone}
        >
          Done
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
  title: { 
    marginTop: 16, 
    fontSize: 28, 
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'DMSans-SemiBold',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  bottomButtons: { 
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12
  },
  shareBtn: { 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#3AB75C', 
    borderColor: '#3AB75C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareBtnText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  doneBtn: {
    height: 48,
  },
  doneBtnText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
});