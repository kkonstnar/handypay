import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

export type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: OnboardingScreenProps): React.ReactElement {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 12 }}>Onboarding</Text>
      <Text style={{ textAlign: 'center', color: '#444', marginBottom: 24, fontFamily: 'DMSans_18pt-Regular' }}>
        Placeholder onboarding screen. We'll add steps later.
      </Text>
      <Button title="Continue" onPress={() => navigation.replace('HomeTabs')} />
    </View>
  );
}
