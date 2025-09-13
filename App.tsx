import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TransactionProvider } from './src/contexts/TransactionContext';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './src/components/SplashScreen';
import Toast from 'react-native-toast-message';
import toastConfig from './src/components/ui/ToastConfig';
import { Linking } from 'react-native';
import { NotificationService } from './src/services/notificationService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Wrapper component to access UserContext
function AppContent(): React.ReactElement {
  const { isLoading: userLoading } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  const onLayoutRootView = useCallback(async () => {
    // Don't hide Expo splash screen here - let the custom splash handle it
  }, []);

  const handleSplashFinish = useCallback(() => {
    // Always finish splash animation immediately, but only transition when user data is ready
    setShowSplash(false);
  }, []);

  // Initialize services and set up handlers
  useEffect(() => {
    console.log('🚀 Initializing app services...');

    // Initialize notification service
    NotificationService.initialize();

    console.log('🌐 Setting up global deep link handler');

    const handleGlobalDeepLink = (event: { url: string }) => {
      console.log('🌐 GLOBAL DEEP LINK RECEIVED:', event.url, 'Timestamp:', Date.now());

      // Check if this is a Google OAuth callback
      if (event.url.includes('auth/callback') || event.url.includes('code=')) {
        console.log('🌐 GLOBAL: Detected OAuth callback URL:', event.url);
        // The individual screen handlers should process this
      }

      // Check if this is a Stripe onboarding callback/completion
      if (event.url.includes('handypay://stripe/callback') ||
          event.url.includes('handypay://stripe/complete') ||
          event.url.includes('handypay://stripe/success') ||
          event.url.includes('handypay://stripe/error')) {
        console.log('🌐 GLOBAL: Detected Stripe onboarding URL:', event.url);
        // Store the Stripe deep link for processing by the onboarding screen
        // This will be handled by the GetStartedPage component
      }
    };

    const subscription = Linking.addEventListener('url', handleGlobalDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then((initialUrl) => {
      console.log('🌐 Global initial URL check:', initialUrl);
      if (initialUrl) {
        console.log('🌐 Processing global initial URL:', initialUrl);
        handleGlobalDeepLink({ url: initialUrl });
      }
    }).catch((error) => {
      console.error('🌐 Error getting global initial URL:', error);
    });

    return () => {
      console.log('🌐 Removing global deep link handler');
      subscription?.remove();
    };
  }, []);

  // Wait for both fonts and user data to be ready before finishing splash
  useEffect(() => {
    if (!userLoading && !showSplash) {
      // Both user data and splash animation are ready
      SplashScreen.hideAsync();
    }
  }, [userLoading, showSplash]);

  if (showSplash) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NetworkProvider>
        <TransactionProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </TransactionProvider>
      </NetworkProvider>
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}

export default function App(): React.ReactElement | null {
  const [fontsLoaded] = useFonts({
    Coolvetica: require('./assets/fonts/coolvetica rg.ttf'),
    'SF-Pro-Rounded-Regular': require('./assets/fonts/SF-Pro-Rounded-Regular.otf'),
    'DMSans_18pt-Regular': require('./assets/fonts/DMSans_18pt-Regular.ttf'),
    'DMSans-Regular': require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('./assets/fonts/DMSans-Medium.ttf'),
    'DMSans_24pt-Regular': require('./assets/fonts/DMSans_24pt-Regular.ttf'),
    'DMSans-SemiBold': require('./assets/fonts/DMSans-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </SafeAreaProvider>
  );
}
