import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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

    let unsubscribe: (() => void) | null = null;

    const setupNetInfo = async () => {
      try {
        // Subscribe to network state changes
        unsubscribe = NetInfo.addEventListener(state => {
          const connected = state.isConnected ?? false;
          const hasInternetReachability = state.isInternetReachable ?? true;
          
          // Consider connected only if both conditions are true
          const actuallyConnected = connected && hasInternetReachability;

          console.log('🌐 Network state changed:', {
            type: state.type,
            isConnected: connected,
            isInternetReachable: hasInternetReachability,
            actuallyConnected,
            timestamp: new Date().toLocaleTimeString()
          });

          setIsConnected(actuallyConnected);

          // Show banner when connection is lost
          if (!actuallyConnected && !showNetworkBanner) {
            console.log('📡 Showing network banner - connection lost');
            setShowNetworkBanner(true);
          }
          // Hide banner when connection is restored
          else if (actuallyConnected && showNetworkBanner) {
            console.log('📡 Hiding network banner - connection restored');
            setShowNetworkBanner(false);
          }
        });

        // Get initial network state
        const state = await NetInfo.fetch();
        const connected = state.isConnected ?? false;
        const hasInternetReachability = state.isInternetReachable ?? true;
        const actuallyConnected = connected && hasInternetReachability;

        console.log('🌐 Initial network state:', {
          type: state.type,
          isConnected: connected,
          isInternetReachable: hasInternetReachability,
          actuallyConnected
        });

        setIsConnected(actuallyConnected);
        setShowNetworkBanner(!actuallyConnected);

      } catch (error) {
        console.warn('⚠️ NetInfo not available, network monitoring disabled until rebuild:', error);
        
        // Just assume connected and hide banner until NetInfo is available
        setIsConnected(true);
        setShowNetworkBanner(false);
      }
    };

    setupNetInfo();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log('🌐 Cleaning up NetInfo subscription');
        unsubscribe();
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
