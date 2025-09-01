import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TransactionProvider } from './src/contexts/TransactionContext';
import { UserProvider } from './src/contexts/UserContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './src/components/SplashScreen';
import Toast from 'react-native-toast-message';
import toastConfig from './src/components/ui/ToastConfig';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

  const [showSplash, setShowSplash] = useState(true);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (showSplash) {
    return <CustomSplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NetworkProvider>
          <UserProvider>
            <TransactionProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </TransactionProvider>
          </UserProvider>
        </NetworkProvider>
        <Toast config={toastConfig} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
