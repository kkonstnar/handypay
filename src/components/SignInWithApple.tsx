import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AppleIcon = () => (
  <Svg width={20} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M14.37 4.75c.69-1.12 1.14-2.51.88-3.95-1.06.08-2.33.71-3.09 1.59-.82 1.08-.93 2.51-.82 3.98.97-.07 2.2-.59 3.03-1.62z"
      fill="#111827"
    />
  </Svg>
);

interface SignInWithAppleProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function SignInWithApple({
  onPress,
  disabled = false
}: SignInWithAppleProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <AppleIcon />
      </View>
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>
        Continue with Apple
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium',
  },
  disabledText: {
    color: '#9ca3af',
  },
});
