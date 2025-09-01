import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

interface NumberFlowProps {
  value: number | string;
  style?: TextStyle;
  format?: (value: number | string) => string;
  duration?: number;
}

export default function NumberFlow({ 
  value, 
  style, 
  format = (val) => val.toString(),
  duration = 150
}: NumberFlowProps): React.ReactElement {
  const [displayValue, setDisplayValue] = useState(format(value));
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (displayValue !== format(value)) {
      // Animate out
      opacity.value = withTiming(0.6, { 
        duration: duration / 2, 
        easing: Easing.ease 
      });
      scale.value = withTiming(0.9, { 
        duration: duration / 2, 
        easing: Easing.ease 
      }, (finished) => {
        if (finished) {
          // Update display value
          setDisplayValue(format(value));
          
          // Animate in
          opacity.value = withTiming(1, { 
            duration: duration / 2, 
            easing: Easing.ease 
          });
          scale.value = withTiming(1, { 
            duration: duration / 2, 
            easing: Easing.ease 
          });
        }
      });
    }
  }, [value, format, duration, displayValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.Text 
      style={[
        {
          fontVariant: ['tabular-nums'],
          fontSize: style?.fontSize || 30,
          fontWeight: style?.fontWeight || '600',
          color: style?.color || '#111827',
          fontFamily: style?.fontFamily || 'SF-Pro-Rounded-Regular'
        },
        style,
        animatedStyle
      ]}
    >
      {displayValue}
    </Animated.Text>
  );
}