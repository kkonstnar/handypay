import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface NumberPadProps {
  onKeyPress: (key: string) => void;
  pressedKey: string | null;
}

export default function NumberPad({ onKeyPress, pressedKey }: NumberPadProps): React.ReactElement {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'delete']
  ];

  const KeyButton = ({ keyValue }: { keyValue: string }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = () => {
      scale.value = withTiming(0.95, { duration: 100 });
      opacity.value = withTiming(0.7, { duration: 100 });
    };

    const handlePressOut = () => {
      scale.value = withTiming(1, { duration: 100 });
      opacity.value = withTiming(1, { duration: 100 });
    };

    return (
      <TouchableOpacity
        style={[
          styles.keyButton,
          pressedKey === keyValue && styles.keyButtonPressed
        ]}
        onPress={() => onKeyPress(keyValue)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.keyContent, animatedStyle]}>
          {keyValue === 'delete' ? (
            <Ionicons name="backspace" size={24} color="#111827" />
          ) : (
            <Text style={styles.keyText}>{keyValue}</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <KeyButton key={key} keyValue={key} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  keyButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  keyButtonPressed: {
    backgroundColor: '#f3f4f6'
  },
  keyContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'SF-Pro-Display-Regular'
  }
});