import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GoogleLogo from '../../../assets/google.svg';
// Using Ionicons instead of SVG imports to avoid module resolution issues
import { useAppleAuth, useGoogleAuth } from '../../services/ExpoAuthService';
import { useUser, createUserFromAppleAuth, createUserFromGoogleAuth } from '../../contexts/UserContext';
import Toast from 'react-native-toast-message';
import { BiometricAuthService } from '../../services';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface AuthenticationMethodModalProps {
  visible: boolean;
  onClose: () => void;
  currentMethod?: 'apple' | 'google';
  onMethodChange?: (method: 'apple' | 'google') => void;
  onShowSafetyPin?: () => void;
  onLogoutWithAuth?: () => void;
  onDeleteAccountWithAuth?: () => void;
}

export default function AuthenticationMethodModal({
  visible,
  onClose,
  currentMethod = 'apple',
  onMethodChange,
  onShowSafetyPin,
  onLogoutWithAuth,
  onDeleteAccountWithAuth
}: AuthenticationMethodModalProps): React.ReactElement {

  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Face ID');
  const [safetyPinEnabled, setSafetyPinEnabled] = useState(false);
  const [devicePasscodeEnabled, setDevicePasscodeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingBiometrics, setCheckingBiometrics] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { user, setUser, clearUser, updateLastLogin, updateFaceIdEnabled, updateSafetyPinEnabled } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    request: appleRequest,
    response: appleResponse,
    promptAsync: applePromptAsync,
  } = useAppleAuth();

  const {
    promptAsync: googlePromptAsync,
  } = useGoogleAuth();

  // Check biometric and auth method status when modal becomes visible
  useEffect(() => {
    if (visible) {
      checkBiometricStatus();
      checkAuthMethodStatus();
    }
  }, [visible, user]);

  const checkBiometricStatus = async () => {
    try {
      const biometricInfo = await BiometricAuthService.getBiometricInfo();
      setFaceIdAvailable(biometricInfo.isAvailable);
      setBiometricType(biometricInfo.biometricType);

      // Set Face ID enabled based on both device capability and user preference
      const deviceCapable = biometricInfo.isAvailable && biometricInfo.isEnrolled;
      const userPreference = user?.faceIdEnabled || false;
      setFaceIdEnabled(deviceCapable && userPreference);

      // Set Device Passcode enabled if Face ID is disabled but device has passcode capability
      // This indicates the user chose device passcode as their authentication method
      setDevicePasscodeEnabled(!user?.faceIdEnabled && biometricInfo.isAvailable);

      // Set Safety PIN enabled based on user preference
      setSafetyPinEnabled(user?.safetyPinEnabled || false);
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setFaceIdAvailable(false);
      setFaceIdEnabled(false);
      setSafetyPinEnabled(user?.safetyPinEnabled || false);
    }
  };

  const checkAuthMethodStatus = () => {
    if (user) {
      // Check if Apple is connected (user has appleUserId)
      setAppleConnected(!!user.appleUserId);

      // Check if Google is connected (user has googleUserId or authProvider is google)
      setGoogleConnected(!!user.googleUserId || user.authProvider === 'google');
    } else {
      setAppleConnected(false);
      setGoogleConnected(false);
    }
  };

  const handleMethodSelect = async (method: 'apple' | 'google') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (method === 'apple') {
      await handleAppleAuthentication();
    } else if (method === 'google') {
      await handleGoogleAuthentication();
    } else {
      onMethodChange?.(method);
      onClose();
    }
  };

  const handleAppleAuthentication = async () => {
    console.log('Apple button pressed in auth method modal, starting auth flow...');
    setLoading(true);

    try {
      const result = await applePromptAsync();
      console.log('Apple auth result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        // Handle native Apple auth success
        const { params } = result;

        // Create user data from Apple auth response
        const userData = createUserFromAppleAuth(params);

        // Save user data
        await setUser(userData);

        // Update last login timestamp in database
        await updateLastLogin();

        console.log('Apple auth user data saved:', userData);

        Toast.show({
          type: 'success',
          text1: 'Successfully signed in!',
        });

        // Close the modal and navigate to biometrics page
        onClose();
        // Navigation will be handled by the parent component
      } else if (result.type === 'cancel') {
        console.log('Apple auth cancelled by user');
      } else if (result.type === 'error') {
        console.error('Apple auth error:', result.error);
        Alert.alert('Error', 'Apple authentication failed');
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      Alert.alert('Error', 'Failed to start Apple authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthentication = async () => {
    console.log('Google button pressed in auth method modal, starting auth flow...');
    setLoading(true);

    try {
      const result = await googlePromptAsync();
      console.log('Google auth result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        // This shouldn't happen with the current backend flow
        console.log('Unexpected success result from Google auth');
      } else if (result.type === 'pending') {
        // Normal flow - OAuth initiated, waiting for callback
        console.log('Google OAuth initiated, waiting for callback...');
        // Don't set loading to false - keep loading state until callback is received
        return;
      } else if (result.type === 'cancel') {
        console.log('Google auth cancelled by user');
      } else if (result.type === 'error') {
        console.error('Google auth error:', result.error);
        Alert.alert('Error', 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Failed to start Google authentication');
    }

    // Only reset loading state if we didn't get a pending result
    setLoading(false);
  };

  const handleFaceIdToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!faceIdAvailable) {
      Alert.alert(
        `${biometricType} Not Available`,
        `${biometricType} is not available on this device or is not set up in device settings.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if device has biometrics enrolled
    const biometricInfo = await BiometricAuthService.getBiometricInfo();
    if (!biometricInfo.isEnrolled) {
      Alert.alert(
        `${biometricType} Not Set Up`,
        `Please set up ${biometricType} in your device settings first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!faceIdEnabled) {
      // Enabling Face ID - trigger authentication to test it
      setCheckingBiometrics(true);
      
      const success = await BiometricAuthService.authenticateWithPrompt(
        `Enable ${biometricType} for HandyPay`,
        {
          showErrorAlert: true,
          allowRetry: true,
          onSuccess: async () => {
            setFaceIdEnabled(true);
            // Update user preference in database
            await updateFaceIdEnabled(true);
            Toast.show({
              type: 'success',
              text1: `${biometricType} enabled successfully!`,
            });
          },
          onError: (error) => {
            console.log(`${biometricType} authentication failed:`, error);
          },
          onCancel: () => {
            console.log(`${biometricType} authentication cancelled`);
          }
        }
      );
      
      setCheckingBiometrics(false);
    } else {
      // Disabling Face ID
      setFaceIdEnabled(false);
      // Update user preference in database
      await updateFaceIdEnabled(false);
      Toast.show({
        type: 'success',
        text1: `${biometricType} disabled`,
      });
    }
  };

  const handleSafetyPinToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!safetyPinEnabled) {
      // Enabling Safety PIN - open the setup modal
      onClose(); // Close the authentication method modal first
      onShowSafetyPin?.(); // Then open the safety pin modal for setup
    } else {
      // Disabling Safety PIN
      setSafetyPinEnabled(false);
      // Update user preference in database
      await updateSafetyPinEnabled(false);
      Toast.show({
        type: 'success',
        text1: 'Safety PIN disabled',
      });
    }
  };

  const handleSafetyPinSetup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('handleSafetyPinSetup called, onShowSafetyPin is:', onShowSafetyPin);
    onClose(); // Close the authentication method modal first
    onShowSafetyPin?.(); // Then open the safety pin modal
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Function to perform actual logout after authentication
    const performLogout = () => {
      Alert.alert(
        'Log out',
        'Are you sure you want to log out of your HandyPay account?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Log out',
            style: 'destructive',
            onPress: async () => {
              try {
                await clearUser();
                onClose();
                // Navigate to StartPage after successful logout
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'StartPage' }],
                });
                Toast.show({
                  type: 'success',
                  text1: 'Logged out successfully',
                });
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to log out. Please try again.');
              }
            }
          }
        ]
      );
    };

    // Require authentication before logout
    if (user?.faceIdEnabled) {
      const biometricInfo = await BiometricAuthService.getBiometricInfo();

      if (biometricInfo.isAvailable && biometricInfo.isEnrolled) {
        // Face ID is enabled and available, use it
        const authSuccess = await BiometricAuthService.authenticateWithPrompt(
          'Authenticate to log out',
          {
            showErrorAlert: true,
            allowRetry: true,
            onSuccess: performLogout
          }
        );

        // If authentication failed or was cancelled, don't proceed
        if (!authSuccess) {
          console.log('❌ Face ID authentication failed or cancelled during logout');
          return;
        }
      } else {
        // Face ID is enabled in user data but not available on device
        // Fall through to safety PIN or direct action
        console.log('⚠️ Face ID enabled but not available on device during logout');
      }
    }

    // If Face ID is disabled OR not available, try Safety PIN
    const biometricInfoForFallback = user?.faceIdEnabled ? await BiometricAuthService.getBiometricInfo() : null;
    if (user?.safetyPinEnabled && (!user?.faceIdEnabled || !biometricInfoForFallback?.isAvailable)) {
      // Use Safety PIN authentication - delegate to parent component
      onClose(); // Close this modal first
      onLogoutWithAuth?.(); // Parent will handle PIN authentication and logout
    } else if (!user?.faceIdEnabled && !user?.safetyPinEnabled) {
      // No authentication required, proceed directly
      performLogout();
    } else {
      // Fallback: if we reach here, something went wrong with the logic
      console.log('⚠️ Authentication fallback triggered during logout');
      if (user?.safetyPinEnabled) {
        onClose(); // Close this modal first
        onLogoutWithAuth?.(); // Parent will handle PIN authentication and logout
      } else {
        performLogout(); // Last resort
      }
    }
  };

  const handleDeleteAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Function to perform actual account deletion after authentication
    const performDelete = async () => {
      console.log('🗑️ Performing account deletion...');

      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      setDeletingAccount(true);

      try {
        console.log(`🗑️ Deleting account for user: ${user.id}`);

        // Include credentials to send cookies/auth headers
        const response = await fetch(
          `https://handypay-backend.handypay.workers.dev/api/users/${user.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies and auth headers
          }
        );

        if (response.ok) {
          try {
            const result = await response.json();
            console.log('✅ Account deletion successful:', result);
          } catch (jsonError) {
            // If response is not JSON, still treat as success
            console.log('✅ Account deletion successful (non-JSON response)');
          }

          // Clear local user data
          await clearUser();

          // Close modal and navigate to start page
          onClose();
          navigation.reset({
            index: 0,
            routes: [{ name: 'StartPage' }],
          });

          Toast.show({
            type: 'success',
            text1: 'Account deleted successfully',
            text2: 'All your data has been removed',
          });
        } else {
          let errorMessage = 'Failed to delete account';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If response is not JSON, get text response
            const textResponse = await response.text();
            console.error('❌ Non-JSON error response:', textResponse);
            if (textResponse.includes('Not Found') || textResponse.includes('404')) {
              errorMessage = 'Delete endpoint not found. Backend needs to be redeployed.';
            } else if (textResponse.includes('Internal Server Error')) {
              errorMessage = 'Server error. Please try again later.';
            }
          }
          console.error('❌ Account deletion failed:', errorMessage);
          Alert.alert('Error', errorMessage);
        }
      } catch (error) {
        console.error('❌ Account deletion error:', error);
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      } finally {
        setDeletingAccount(false);
      }
    };

    // Determine authentication method
    let authMethod: 'faceid' | 'pin' | 'none' = 'none';

    if (user?.faceIdEnabled) {
      const biometricInfo = await BiometricAuthService.getBiometricInfo();
      if (biometricInfo.isAvailable && biometricInfo.isEnrolled) {
        authMethod = 'faceid';
      }
    }

    if (authMethod === 'none' && user?.safetyPinEnabled) {
      authMethod = 'pin';
    }

    // Execute authentication based on determined method
    if (authMethod === 'faceid') {
      console.log('🔐 Using Face ID for account deletion');
      const authSuccess = await BiometricAuthService.authenticateWithPrompt(
        'Authenticate to delete account',
        {
          showErrorAlert: true,
          allowRetry: true,
          onSuccess: async () => {
            console.log('✅ Face ID authentication successful for account deletion');
            await performDelete();
          }
        }
      );

      // If authentication failed or was cancelled, don't proceed
      if (!authSuccess) {
        console.log('❌ Face ID authentication failed or cancelled during account deletion');
        return;
      }
      // Don't continue - Face ID authentication handles everything
      return;
    } else if (authMethod === 'pin') {
      console.log('🔐 Using PIN for account deletion');
      onClose(); // Close this modal first
      if (onDeleteAccountWithAuth) {
        // Use the dedicated account deletion auth handler
        onDeleteAccountWithAuth();
      } else {
        // Fallback if no PIN auth handler is available
        performDelete();
      }
      return;
    } else {
      // No authentication required
      console.log('⚠️ No authentication required for account deletion');
      performDelete();
    }
  };

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
          <Text style={styles.title}>Password & security</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Manage your authentication methods and security settings.
          </Text>

         

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, loading && styles.disabledButton]}
              onPress={() => handleMethodSelect('apple')}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.iconContainer}>
                {loading ? (
                  <ActivityIndicator size={20} color="#111827" />
                ) : (
                  <Ionicons name="logo-apple" size={24} color="#111827" />
                )}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {loading ? 'Signing in...' : 'Apple'}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {appleConnected ? 'Connected' : 'Not connected'}
                </Text>
                {appleConnected && (
                  <Text style={[styles.optionSubtitle, { fontSize: 12, color: '#6b7280', marginTop: 4 }]}>
                    Secure backup access
                  </Text>
                )}
              </View>
              {!loading && (
                <View style={[styles.toggle, appleConnected && styles.toggleEnabled]}>
                  <View style={[styles.toggleKnob, appleConnected && styles.toggleKnobEnabled]} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, loading && styles.disabledButton]}
              onPress={() => handleMethodSelect('google')}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={styles.iconContainer}>
                {loading ? (
                  <ActivityIndicator size={20} color="#111827" />
                ) : (
                  <GoogleLogo width={24} height={24} />
                )}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {loading ? 'Signing in...' : 'Google'}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {googleConnected ? 'Connected' : 'Not connected'}
                </Text>
                {googleConnected && (
                  <Text style={[styles.optionSubtitle, { fontSize: 12, color: '#6b7280', marginTop: 4 }]}>
                    Secure backup access
                  </Text>
                )}
              </View>
              {!loading && (
                <View style={[styles.toggle, googleConnected && styles.toggleEnabled]}>
                  <View style={[styles.toggleKnob, googleConnected && styles.toggleKnobEnabled]} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, checkingBiometrics && styles.disabledButton]}
              onPress={handleFaceIdToggle}
              activeOpacity={0.7}
              disabled={checkingBiometrics}
            >
              <View style={styles.iconContainer}>
                {checkingBiometrics ? (
                  <ActivityIndicator size={20} color="#111827" />
                ) : (
                  <Ionicons name="scan" size={24} color="#111827" />
                )}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{biometricType}</Text>
                <Text style={styles.optionSubtitle}>
                  {checkingBiometrics
                    ? 'Checking...'
                    : !faceIdAvailable
                      ? 'Not available'
                      : faceIdEnabled
                        ? 'Enabled'
                        : 'Disabled'
                  }
                </Text>
              </View>
              {!checkingBiometrics && (
                <View style={[styles.toggle, faceIdEnabled && styles.toggleEnabled]}>
                  <View style={[styles.toggleKnob, faceIdEnabled && styles.toggleKnobEnabled]} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleSafetyPinToggle}
              activeOpacity={0.7}
            >
              <Ionicons name="keypad" size={24} color="#111827" />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Safety PIN</Text>
                <Text style={styles.optionSubtitle}>
                  {safetyPinEnabled ? 'Set up' : 'Not set up'}
                </Text>
              </View>
              <View style={[styles.toggle, safetyPinEnabled && styles.toggleEnabled]}>
                <View style={[styles.toggleKnob, safetyPinEnabled && styles.toggleKnobEnabled]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Device passcode is managed by iOS, no toggle needed
                Alert.alert(
                  'Device Passcode',
                  'Device passcode is managed by your device settings. To change your passcode, go to Settings > Face ID & Passcode (or Touch ID & Passcode) on your device.',
                  [{ text: 'OK' }]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="key" size={24} color="#111827" />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Device Passcode</Text>
                <Text style={styles.optionSubtitle}>
                  {devicePasscodeEnabled ? 'Available' : 'Not available'}
                </Text>
              </View>
              <View style={[styles.toggle, devicePasscodeEnabled && styles.toggleEnabled]}>
                <View style={[styles.toggleKnob, devicePasscodeEnabled && styles.toggleKnobEnabled]} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
               <Ionicons name="log-out-outline" size={24} color="#dc2626" />
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, styles.logoutText]}>Log out</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, deletingAccount && styles.disabledButton]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <ActivityIndicator size={20} color="#dc2626" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#dc2626" />
              )}
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, styles.deleteAccountText]}>
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </Text>
                <Text style={styles.optionSubtitle}>
                  Permanently delete your account and all data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'DMSans-Medium'
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
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff'
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  optionContent: {
    flex: 1,
    marginLeft: 16
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium'
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'DMSans-Medium'
  },
  toggle: {
    width: 48,
    height: 28,
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center'
  },
  toggleEnabled: {
    backgroundColor: '#3AB75C'
  },
  toggleKnob: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2
  },
  toggleKnobEnabled: {
    transform: [{ translateX: 20 }]
  },
  lastOptionButton: {
    borderBottomWidth: 0
  },
  logoutButton: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  logoutText: {
    color: '#dc2626'
  },
  
  deleteAccountText: {
    color: '#dc2626'
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  }
});
