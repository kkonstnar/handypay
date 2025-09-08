import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PhoneTopSvg from '../../../assets/Frame 2121453342.svg';
import HandyPayLogo from '../../../assets/handypay.svg';
import QRCodeSvg from '../../../assets/qr-code-https---handyhurry-c-2025-08-20T12-23-41.svg';
import GoogleLogo from '../../../assets/google.svg';
import SystemBannerContainer from '../../components/ui/SystemBannerContainer';
import EmailLoginModal from '../../components/modals/EmailLoginModal';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppleAuth, useGoogleAuth } from '../../services/ExpoAuthService';
import { useUser, createUserFromAppleAuth, createUserFromGoogleAuth } from '../../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Backend API URL
const API_URL = "https://handypay-backend.handypay.workers.dev";

// Helper function to load existing user data to preserve stripe information
const loadExistingUserData = async (googleUserId: string) => {
  try {
    // Check all stored users to find one with matching Google ID
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.startsWith('@handypay_user_'));

    for (const key of userKeys) {
      try {
        const userDataStr = await AsyncStorage.getItem(key);
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.googleUserId === googleUserId) {
            console.log('✅ Found existing user data for Google ID:', googleUserId);
            return userData;
          }
        }
      } catch (error) {
        console.warn('Error parsing user data for key:', key, error);
      }
    }

    console.log('ℹ️ No existing user data found for Google ID:', googleUserId);
    return null;
  } catch (error) {
    console.error('❌ Error loading existing user data:', error);
    return null;
  }
};

// Helper function to determine navigation destination based on user status
const getNavigationDestination = (userData: any): string => {
  const hasAccount = userData.id && userData.id !== '';

  if (hasAccount && userData.stripeAccountId && userData.stripeOnboardingCompleted) {
    // If user has account with Stripe ID and onboarding is complete, go to home
    return 'HomeTabs';
  } else if (hasAccount && userData.stripeAccountId) {
    // If user has account with Stripe ID but onboarding not complete, go to GetStartedPage
    return 'GetStartedPage';
  } else {
    // New user or no Stripe ID - go through normal flow starting from biometrics
    return 'BiometricsPage';
  }
};


export type StartPageProps = NativeStackScreenProps<RootStackParamList, 'StartPage'>;

export default function StartPage({ navigation }: StartPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showNetworkBanner, setShowNetworkBanner] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const { user, setUser, updateLastLogin } = useUser();

  // Reset navigation flag when user becomes null (after account deletion)
  useEffect(() => {
    if (!user) {
      setHasNavigated(false);
    }
  }, [user]);

  // Simple network connectivity monitoring
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkConnectivity = async () => {
      try {
        // Simple connectivity check using fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const isConnected = response.ok;

        console.log('🌐 Network check result:', { isConnected });

        setIsConnected(isConnected);

        // Show banner when connection is lost
        if (!isConnected && !showNetworkBanner) {
          console.log('📡 Showing network banner - connection lost');
          setShowNetworkBanner(true);
        }
        // Hide banner when connection is restored
        else if (isConnected && showNetworkBanner) {
          console.log('📡 Hiding network banner - connection restored');
          setShowNetworkBanner(false);
        }
      } catch (error) {
        console.log('🌐 Network check failed:', error instanceof Error ? error.message : 'Unknown error');
        const isConnected = false;

        setIsConnected(isConnected);

        // Show banner when connection is lost
        if (!showNetworkBanner) {
          console.log('📡 Showing network banner - connection lost');
          setShowNetworkBanner(true);
        }
      }
    };

    // Delay initial connectivity check to prevent flash on mount
    setTimeout(() => checkConnectivity(), 1000);

    // Check connectivity every 30 seconds to prevent flashes (was 10 seconds)
    intervalId = setInterval(checkConnectivity, 30000);

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showNetworkBanner]);

  // COMMENTED OUT: Only handle navigation for completely new users who just signed up
  // Existing users are handled by RootNavigator based on their onboarding status
  /*
  useEffect(() => {
    const handleNewUser = async () => {
      if (hasNavigated || !user?.id) return;

      console.log('🔍 StartPage navigation check:', {
        userId: user.id,
        hasStripeAccountId: !!user.stripeAccountId,
        stripeAccountId: user.stripeAccountId,
        stripeOnboardingCompleted: user.stripeOnboardingCompleted
      });

      // Only navigate to BiometricsPage if this is a completely new user
      // Check if user has ANY Stripe-related data - if so, let RootNavigator handle it
      const hasAnyStripeData = user.stripeAccountId || user.stripeOnboardingCompleted;

      if (!hasAnyStripeData) {
        console.log('👤 StartPage: Completely new user (no Stripe data) - navigating to BiometricsPage');
        setTimeout(() => {
          setHasNavigated(true);
          navigation.navigate('BiometricsPage');
        }, 500);
      } else {
        console.log('🚫 StartPage: User has Stripe data - letting RootNavigator handle navigation');
        // User has some Stripe-related data, let RootNavigator check backend and decide
        return;
      }
    };

    handleNewUser();
  }, [user, navigation, hasNavigated]);
  */



  // Handle authentication deep links
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      // Check if this is a Google OAuth callback
      if (event.url.includes('google') || event.url.includes('oauth') ||
          event.url.includes('auth.expo.io') || event.url.includes('code=') ||
          event.url.includes('auth/callback')) {
        try {
          const url = new URL(event.url.split('#')[0]);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            Alert.alert('Authentication Error', `Google OAuth failed: ${error}`);
            setLoading(false);
            setProvider(null);
            return;
          }

          if (code) {
            console.log('🔵 Processing Google OAuth deep link with code:', code);

            // For now, create a basic user account since we have the OAuth code
            // In a full implementation, we'd exchange this for tokens and user info
            const userId = `google_${Date.now()}`;
            const userData = {
              id: userId,
              email: null, // Would be populated from token exchange
              fullName: null, // Would be populated from token exchange
              firstName: null,
              lastName: null,
              authProvider: 'google' as const,
              appleUserId: null,
              googleUserId: userId,
              stripeAccountId: null,
              stripeOnboardingCompleted: false,
              memberSince: new Date().toISOString(),
              faceIdEnabled: false,
              safetyPinEnabled: false,
              avatarUri: undefined,
            };

            console.log('👤 Creating Google user data from deep link:', userData.id);

            await setUser(userData);
            await updateLastLogin();

            Toast.show({
              type: 'success',
              text1: 'Successfully signed in with Google!',
            });

            setLoading(false);
            setProvider(null);

            // Let RootNavigator handle navigation based on user onboarding status
          } else {
            Alert.alert('Authentication Error', 'No authorization code received from Google');
            setLoading(false);
            setProvider(null);
          }
        } catch (error) {
          Alert.alert('Authentication Error', `Failed to complete Google authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoading(false);
          setProvider(null);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription?.remove();
  }, [navigation, setUser, updateLastLogin]);

  const { promptAsync: applePromptAsync } = useAppleAuth();
  const { promptAsync: googlePromptAsync } = useGoogleAuth();

  // Reset loading state when component unmounts or focus changes
  useEffect(() => {
    return () => {
      // Reset loading state when component unmounts
      setLoading(false);
      setProvider(null);
    };
  }, []);

  // Reset loading state when screen gets focus (user navigates back)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (loading || provider) {
        console.log('🔄 Resetting auth state due to screen focus');
        setLoading(false);
        setProvider(null);

        // Show cancellation toast
        Toast.show({
          type: 'info',
          text1: 'Login cancelled',
          text2: 'You can try again anytime'
        });
      }
    });

    return unsubscribe;
  }, [navigation, loading, provider]);





  const handleApplePress = async () => {
    setLoading(true);
    setProvider('apple');

    try {
      const result = await applePromptAsync();

      if (result.type === 'success') {
        const appleParams = result.params;
        const userData = (result as any).userData;

        console.log('🍎 Apple auth successful, user data:', userData?.id);

        if (userData) {
          console.log('👤 Storing Apple user data locally:', userData.id);

          await setUser(userData);
          await updateLastLogin();

          Toast.show({
            type: 'success',
            text1: 'Successfully signed in!',
          });

          // Let RootNavigator handle navigation based on user onboarding status
          // Don't navigate here to avoid conflicts with RootNavigator logic
        } else {
          console.error('❌ No user data received from Apple authentication');
          Alert.alert('Error', 'Authentication failed - no user data created');
        }
      } else if (result.type === 'error') {
        console.error('❌ Apple authentication error:', result.error);
        Alert.alert('Error', result.error?.message || 'Apple authentication failed');
      } else if (result.type === 'cancel') {
        console.log('🚫 Apple authentication cancelled by user');
        Toast.show({
          type: 'info',
          text1: 'Login cancelled',
          text2: 'You can try again anytime'
        });
      } else {
        console.log('🚫 Apple authentication dismissed/cancelled');
        Toast.show({
          type: 'info',
          text1: 'Login cancelled',
          text2: 'You can try again anytime'
        });
      }
    } catch (error) {
      console.error('❌ Apple authentication error:', error);
      Alert.alert('Error', 'Failed to start Apple authentication');
    } finally {
      setLoading(false);
      setProvider(null);
    }
  };

  const handleGooglePress = async () => {
    setLoading(true);
    setProvider('google');

    try {
      const result = await googlePromptAsync();

      if (result.type === 'success') {
        console.log('🔵 Google OAuth initiated successfully');

        // For Google, the actual authentication happens via deep link
        // The user will be redirected back via the deep link handler
        // Don't show success message here as the user hasn't completed auth yet
      } else if (result.type === 'error') {
        console.error('❌ Google authentication error:', result.error);
        Alert.alert('Error', result.error?.message || 'Google authentication failed');
      } else if (result.type === 'cancel') {
        console.log('🚫 Google authentication cancelled by user');
        Toast.show({
          type: 'info',
          text1: 'Login cancelled',
          text2: 'You can try again anytime'
        });
      } else {
        console.log('🚫 Google authentication dismissed/cancelled');
        Toast.show({
          type: 'info',
          text1: 'Login cancelled',
          text2: 'You can try again anytime'
        });
      }
    } catch (error) {
      console.error('❌ Google authentication error:', error);
      Alert.alert('Error', 'Failed to start Google authentication');
    } finally {
      setLoading(false);
      setProvider(null);
    }
  };

  const handleEmailLoginPress = () => {
    console.log('📧 Opening email login modal');
    setShowEmailLogin(true);
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {showNetworkBanner && (
        <SystemBannerContainer
          message="No internet connection. Please check your network."
          type="warning"
          initiallyVisible={true}
        />
      )}
      <View style={styles.header}>
        <HandyPayLogo width={80} height={80} />
      </View>

      <View style={styles.visualSection}>
        <View style={{ position: 'relative', alignItems: 'center' }}>
          <PhoneTopSvg width={200} height={240} />
          <View style={styles.qrCodeContainer}>
            <QRCodeSvg width={120} height={120} />
          </View>
          <LinearGradient
            colors={["rgba(255,255,255,1)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0)"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.gradientWrap}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.mainHeading}>Start accepting payments with your phone</Text>
        <Text style={styles.subText}>
          ZERO down time. No monthly fees. Just your phone and a few quick steps.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={handleApplePress}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.iconContainer}>
              {loading ? (
                <ActivityIndicator size={20} color="#111827" />
              ) : (
                <Ionicons name="logo-apple" size={20} color="#111827" />
              )}
            </View>
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Continue with Apple'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, loading && styles.disabledButton]}
            onPress={handleGooglePress}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.iconContainer}>
              {loading ? (
                <ActivityIndicator size={20} color="#111827" />
              ) : (
                <GoogleLogo width={20} height={20} />
              )}
            </View>
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmailLoginPress}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={[styles.emailLinkText, loading && styles.disabledText]}>
              Continue with Email
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      <EmailLoginModal
        visible={showEmailLogin}
        onClose={() => setShowEmailLogin(false)}
      />
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
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8
  },
  visualSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end'
  },
  gradientWrap: {
    position: 'absolute',
    bottom: -6,
    left: -140,
    right: -150,
    height: 110,
  },
  qrCodeContainer: {
    position: 'absolute',
    top: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Coolvetica',
    color: '#222',
    textAlign: 'center',
    lineHeight: 38,
    paddingTop: 8
  },
  subText: {
    marginTop: 12,
    fontFamily: 'DMSans-Medium',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  authButton: {
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium',
  },
  emailLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'DMSans-Medium',
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.5,
  },
});
