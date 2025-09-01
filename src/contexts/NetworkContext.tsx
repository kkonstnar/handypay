import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemBannerContainer from '../components/ui/SystemBannerContainer';

interface NetworkContextType {
  isConnected: boolean;
  showNetworkBanner: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  showNetworkBanner: false,
});

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showNetworkBanner, setShowNetworkBanner] = useState(false);
  const insets = useSafeAreaInsets();

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
        const connected = response.ok;

        console.log('🌐 Global Network Check:', { connected, timestamp: new Date().toLocaleTimeString() });

        setIsConnected(connected);

        // Show banner immediately when connection is lost
        if (!connected && !showNetworkBanner) {
          console.log('📡 Instantly showing global network banner - connection lost');
          setShowNetworkBanner(true);
        }
        // Hide banner immediately when connection is restored
        else if (connected && showNetworkBanner) {
          console.log('📡 Instantly hiding global network banner - connection restored');
          setShowNetworkBanner(false);
        }
      } catch (error) {
        console.log('🌐 Global Network check failed:', error instanceof Error ? error.message : 'Unknown error');
        const connected = false;

        setIsConnected(connected);

        // Show banner when connection is lost
        if (!showNetworkBanner) {
          console.log('📡 Showing global network banner - connection failed');
          setShowNetworkBanner(true);
        }
      }
    };

    // Check connectivity immediately on mount
    checkConnectivity();

    // Check connectivity every 3 seconds for faster response (reduced from 5s)
    intervalId = setInterval(checkConnectivity, 3000);

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showNetworkBanner]);

  return (
    <NetworkContext.Provider value={{ isConnected, showNetworkBanner }}>
      {children}

      {/* Global Network Banner - positioned at top of screen */}
      {showNetworkBanner && (
        <View style={[styles.bannerContainer, { top: insets.top }]}>
          <SystemBannerContainer
            message="No internet connection. Some features may not be available."
            type="warning"
            initiallyVisible={true}
          />
        </View>
      )}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Very high z-index to appear on top
    elevation: 9999, // For Android
  },
});
