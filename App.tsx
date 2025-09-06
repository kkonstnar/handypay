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
