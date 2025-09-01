import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface RollingNumberProps {
  value: number;
  style: any;
}

export default function RollingNumber({ value, style }: RollingNumberProps): React.ReactElement {
  const formatValue = (val: number) => val.toFixed(2);
  const currentText = formatValue(value);
  const [displayText, setDisplayText] = useState(currentText);
  
  const translateY = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (currentText !== displayText) {
      const newValue = parseFloat(currentText);
      const oldValue = parseFloat(displayText);
      const isIncreasing = newValue > oldValue;
      
      // Start from opposite position (smooth entry)
      translateY.value = isIncreasing ? 40 : -40;
      
      // Update text immediately for smooth transition
      setDisplayText(currentText);
      
      // Animate smoothly to center with iOS easing
      translateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [currentText]);

  return (
    <View style={{ 
      overflow: 'hidden', 
      height: 50, 
      position: 'relative', 
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Animated.Text style={[style, animatedStyle]}>
        {displayText}
      </Animated.Text>
    </View>
  );
}