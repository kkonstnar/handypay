import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
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
    console.log('🌐 Setting up NetInfo network monitoring...');

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('🌐 Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        timestamp: new Date().toLocaleTimeString()
      });

      const connected = state.isConnected === true && state.isInternetReachable !== false;
      
      // Only update if there's actually a change
      if (connected !== isConnected) {
        console.log(`🌐 Network status changed: ${isConnected ? 'connected' : 'disconnected'} → ${connected ? 'connected' : 'disconnected'}`);
        setIsConnected(connected);
      }

      // Show banner immediately when connection is lost
      if (!connected && !showNetworkBanner) {
        console.log('📡 Showing network banner - connection lost');
        setShowNetworkBanner(true);
      }
      // Hide banner immediately when connection is restored
      else if (connected && showNetworkBanner) {
        console.log('📡 Hiding network banner - connection restored');
        setShowNetworkBanner(false);
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      console.log('🌐 Initial network state:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      });

      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsConnected(connected);

      // Don't show banner on initial load unless definitely disconnected
      if (!connected) {
        setShowNetworkBanner(true);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🌐 Cleaning up NetInfo subscription');
      unsubscribe();
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
