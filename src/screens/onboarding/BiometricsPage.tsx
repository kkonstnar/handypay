import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ArrowSvg from '../../../assets/arrow.svg';
import BiometricIllustrationSvg from '../../../assets/Biometric activation illustration.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useUser } from '../../contexts/UserContext';

export type BiometricsPageProps = NativeStackScreenProps<RootStackParamList, 'BiometricsPage'>;

export default function BiometricsPage({ navigation }: BiometricsPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { updateFaceIdEnabled, clearUser } = useUser();
  const [biometricType, setBiometricType] = useState<string>('None');
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      console.log('🔍 Checking biometric support...');

      // Check if hardware is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('🔧 Hardware available:', hasHardware);

      if (!hasHardware) {
        setIsBiometricSupported(false);
        setBiometricType('None');
        setIsEnrolled(false);
        console.log('❌ Biometric hardware not available');
        return;
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('👤 Biometrics enrolled:', isEnrolled);

      if (!isEnrolled) {
        setIsBiometricSupported(true);
        setBiometricType('Biometric');
        setIsEnrolled(false);
        console.log('⚠️ Biometric hardware available but not enrolled');
        return;
      }

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('🔒 Supported types:', supportedTypes);

      setIsBiometricSupported(true);
      setIsEnrolled(true);

      // Determine biometric type based on supported types
      let type = 'Biometric';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        type = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        type = 'Touch ID';
      }

      setBiometricType(type);

      console.log('🎉 Biometric Support Summary:', {
        hasHardware,
        isEnrolled,
        supportedTypes,
        type
      });

    } catch (error) {
      console.error('❌ Error checking biometric support:', error);
      setIsBiometricSupported(false);
      setBiometricType('None');
      setIsEnrolled(false);
    }
  };

  const getBiometricTypeText = () => {
    if (!biometricType || biometricType === 'None') return 'biometric';
    return biometricType;
  };

  const handleEnableBiometrics = async () => {
    if (!isBiometricSupported) {
      Alert.alert('Not Supported', 'Biometric authentication is not supported on this device.');
      return;
    }

    if (!isEnrolled) {
      Alert.alert(
        'Biometrics Not Set Up',
        `Please set up ${getBiometricTypeText()} in your device settings first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAuthenticating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      console.log('🚀 Starting biometric authentication...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Use ${getBiometricTypeText()} or device passcode to secure your HandyPay account`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow device passcode fallback
      });

      console.log('🎯 Biometric auth result:', result);

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Enable Face ID in the user's database profile
        await updateFaceIdEnabled(true);
        console.log('✅ Face ID enabled in user profile');
        
        // Continue directly to the next page without alert
        navigation.navigate('FeaturesPage');
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        Alert.alert(
          'Authentication Failed',
          result.error || `${getBiometricTypeText()} authentication failed.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Try Again',
              onPress: () => handleEnableBiometrics()
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      Alert.alert('Error', `Unable to authenticate. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUsePasscode = async () => {
    console.log('🔢 User chose to use device passcode - checking device capabilities first');

    // First check if device has biometrics enrolled
    try {
      const biometricInfo = await LocalAuthentication.getEnrolledLevelAsync();
      console.log('🔍 Biometric enrollment level:', biometricInfo);

      // If biometrics are enrolled, we need to be more explicit
      if (biometricInfo > 0) {
        Alert.alert(
          'Biometrics Detected',
          'Your device has biometric authentication enrolled. To use device passcode only, please either:\n\n• Temporarily disable Face ID/Touch ID in Settings\n• Or use the Face ID option above\n\nWould you like to continue with passcode authentication?',
          [
            { text: 'Use Face ID Instead', onPress: () => handleEnableBiometrics() },
            { text: 'Continue with Passcode', style: 'default', onPress: () => performPasscodeAuth() }
          ]
        );
      } else {
        // No biometrics enrolled, proceed with passcode
        await performPasscodeAuth();
      }
    } catch (error) {
      console.log('❌ Error checking biometric enrollment, proceeding with passcode auth');
      await performPasscodeAuth();
    }
  };

  const performPasscodeAuth = async () => {
    console.log('🔐 Performing passcode-only authentication');

    try {
      // On iOS, we need to use a different approach to force passcode
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enter your device passcode to continue',
        cancelLabel: 'Cancel',
        // Try different combinations to force passcode
        disableDeviceFallback: true,
      });

      console.log('🔐 Passcode authentication result:', result);

      if (result.success) {
        console.log('✅ Passcode authentication successful');
        navigation.navigate('FeaturesPage');
      } else {
        console.log('❌ Passcode authentication failed:', result.error);
        Alert.alert(
          'Authentication Failed',
          'Device passcode authentication failed. Please try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Try Again',
              onPress: () => performPasscodeAuth()
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Passcode authentication error:', error);
      Alert.alert(
        'Error',
        'Unable to authenticate with device passcode. This might be due to device settings.',
        [
          { text: 'Use Face ID Instead', onPress: () => handleEnableBiometrics() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleBackPress = async () => {
    Alert.alert(
      'Switch Account?',
      'Would you like to sign in with a different account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Log out the current user
              await clearUser();
              // Navigate to StartPage to allow different account login
              navigation.replace('StartPage');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to switch accounts. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleBackPress}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ArrowSvg width={24} height={24} />
        </Button>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <BiometricIllustrationSvg width={280} height={280} />
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={styles.headline}>
            Secure your account with {getBiometricTypeText()}
          </Text>
          <Text style={styles.subText}>
            {isBiometricSupported && isEnrolled 
              ? `Use ${getBiometricTypeText()} to quickly and securely sign in and approve transactions. If ${getBiometricTypeText()} fails, you can always use your device passcode as backup.`
              : isBiometricSupported && !isEnrolled
                ? `Set up ${getBiometricTypeText()} in your device settings to enable secure authentication.`
                : 'Biometric authentication is not available on this device, but you can still secure your account with your device passcode.'
            }
          </Text>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <Button
          style={styles.enableButton}
          textStyle={styles.enableButtonText}
          onPress={handleEnableBiometrics}
          disabled={isAuthenticating}
        >
          {isAuthenticating 
            ? 'Authenticating...' 
            : isBiometricSupported && isEnrolled
              ? `Enable ${getBiometricTypeText()}`
              : isBiometricSupported && !isEnrolled
                ? 'Set Up Biometrics'
                : 'Continue'
          }
        </Button>
        
        <Button
          variant="ghost"
          style={styles.skipButton}
          textStyle={styles.skipButtonText}
          onPress={handleUsePasscode}
          disabled={isAuthenticating}
        >
          Use passcode
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Coolvetica',
  },
  subText: {
    fontSize: 16,
    fontFamily: 'DMSans-Medium',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  enableButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    borderColor: '#3AB75C',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans-SemiBold',
    color: '#ffffff',
  },
  skipButton: {
    height: 44,
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'DMSans-SemiBold',
    color: '#6b7280',
  },
});