import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  useAnimatedGestureHandler,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

interface SystemBannerProps {
  message?: string;
  type?: 'warning' | 'error' | 'info';
  showIcon?: boolean;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export default function SystemBanner({ 
  message = "You are not connected to the internet", 
  type = 'warning',
  showIcon = true,
  onDismiss,
  dismissible = true
}: SystemBannerProps): React.ReactElement {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleDismiss = () => {
    if (onDismiss) {
      translateY.value = withTiming(-100, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
      setTimeout(() => onDismiss(), 250);
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {},
    onActive: (event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    },
    onEnd: (event) => {
      if (event.translationY < -50) {
        translateY.value = withTiming(-100, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => runOnJS(handleDismiss)(), 200);
      } else {
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const getIconName = () => {
    switch (type) {
      case 'error': return 'alert-circle';
      case 'warning': return 'information-circle';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={dismissible}>
      <Animated.View style={[styles.container, styles[type], animatedStyle]}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name={getIconName()} size={18} color="#ffffff" />
          </View>
        )}
        <Text style={styles.message}>{message}</Text>
        {dismissible && onDismiss ? (
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  warning: {
    backgroundColor: '#ea580c',
  },
  error: {
    backgroundColor: '#dc2626',
  },
  info: {
    backgroundColor: '#2563eb',
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'DMSans-Medium',
  },
  chevron: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
});