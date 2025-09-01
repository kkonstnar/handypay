import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StatusBar, Dimensions } from 'react-native';
import HandyPayLogo from '../../assets/handypay.svg';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps): React.ReactElement {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const screenHeight = Dimensions.get('window').height;
    // Use a percentage-based approach that works across device sizes
    // Move logo from center to approximately 15% from top (accounting for safe areas)
    const targetPosition = -(screenHeight * 0.35);
    
    // Phase 1: Fade in and scale up (0-1s)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: After fade in, move logo up to StartPage position (8% from top)
      Animated.timing(translateYAnim, {
        toValue: targetPosition,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Phase 3: Immediately transition to start page after logo moves up
        onFinish();
      });
    });

    // Backup timer in case animation doesn't complete
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, translateYAnim, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
          },
        ]}
      >
        <HandyPayLogo width={80} height={80} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});