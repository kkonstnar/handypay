import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { TouchableOpacityProps } from 'react-native';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  enableHaptics?: boolean;
}

const Button = (props: ButtonProps): React.ReactElement => {
  const {
    children,
    variant = 'default',
    size = 'default',
    disabled = false,
    loading = false,
    onPress,
    style,
    textStyle,
    enableHaptics = true,
    ...restProps
  } = props;

  const handlePress = async (event: any) => {
    if (enableHaptics && !disabled && !loading) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress(event);
    }
  };
  const buttonStyles: Array<StyleProp<ViewStyle>> = [
    styles.base,
    styles[variant],
    styles[`size_${size}` as const],
    disabled && styles.disabled,
    style,
  ];

  const textStyles: Array<StyleProp<TextStyle>> = [
    styles.baseText,
    styles[`${variant}Text` as const],
    styles[`size_${size}Text` as const],
    disabled && styles.disabledText,
    textStyle,
  ];

  const indicatorColor = variant === 'default' || variant === 'destructive' ? 'white' : 'black';

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={disabled || loading ? undefined : handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      hitSlop={(restProps as any).hitSlop ?? { top: 8, bottom: 8, left: 8, right: 8 }}
      {...restProps}
    >
      <View style={styles.contentRow}>
        {loading && (
          <ActivityIndicator size="small" color={indicatorColor} style={styles.loader} />
        )}
        {React.Children.toArray(children).map((child, index) => {
          if (typeof child === 'string' || typeof child === 'number') {
            return (
              <Text key={`btn-text-${index}`} style={textStyles}>
                {child}
              </Text>
            );
          }
          return child as React.ReactElement;
        })}
      </View>
    </TouchableOpacity>
  );
};

// Example groups
export const StartPageButtons = (): React.ReactElement => {
  return (
    <View style={exampleStyles.buttonContainer}>
      <Button
        variant="secondary"
        style={exampleStyles.authButton}
        textStyle={exampleStyles.authButtonText}
        onPress={() => console.log('Apple sign in')}
      >
        <Ionicons name="logo-apple" size={18} color="black" style={exampleStyles.buttonIcon} />
         Continue with Apple
      </Button>

      <Button
        variant="secondary"
        style={exampleStyles.authButton}
        textStyle={exampleStyles.authButtonText}
        onPress={() => console.log('Google sign in')}
      >
        <Ionicons name="logo-google" size={18} color="black" style={exampleStyles.buttonIcon} />
         Continue with Google
      </Button>
    </View>
  );
};

export interface PrivacyPageButtonProps {
  isScrolledToBottom: boolean;
  onPress: () => void;
}

export const PrivacyPageButton = ({
  isScrolledToBottom,
  onPress,
}: PrivacyPageButtonProps): React.ReactElement => {
  return (
    <View style={exampleStyles.floatingButtonContainer}>
      <Button style={exampleStyles.floatingButton} textStyle={exampleStyles.floatingButtonText} onPress={onPress}>
        {isScrolledToBottom ? 'Continue' : 'Scroll down'}
      </Button>
    </View>
  );
};

export const TermsPageButtons = (): React.ReactElement => {
  return (
    <View>
      <View style={exampleStyles.policyContainer}>
        <Button
          variant="secondary"
          size="sm"
          style={exampleStyles.readButton}
          textStyle={exampleStyles.readButtonText}
          onPress={() => console.log('Read privacy policy')}
        >
          Read
        </Button>
      </View>

      <View style={exampleStyles.confirmButtonContainer}>
        <Button
          style={exampleStyles.confirmButton}
          textStyle={exampleStyles.confirmButtonText}
          onPress={() => console.log('Confirm & continue')}
        >
          Confirm & continue
        </Button>
      </View>
    </View>
  );
};

export interface BackButtonProps {
  onPress: () => void;
}

export const BackButton = ({ onPress }: BackButtonProps): React.ReactElement => {
  return (
    <Button variant="ghost" size="icon" style={exampleStyles.backButton} onPress={onPress}>
      <Ionicons name="arrow-back" size={24} color="black" />
    </Button>
  );
};

export interface LoadingButtonProps {
  loading: boolean;
}

export const LoadingButton = ({ loading }: LoadingButtonProps): React.ReactElement => {
  return (
    <Button loading={loading} disabled={loading} onPress={() => console.log('Processing...')}>
      {loading ? 'Processing...' : 'Submit'}
    </Button>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  default: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  destructive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#e2e8f0',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
    borderColor: '#f1f5f9',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  size_default: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  size_lg: {
    height: 44,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  size_icon: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
    // On iOS, controlling lineHeight helps center with icons
    lineHeight: 18,
  },
  defaultText: {
    color: '#ffffff',
  },
  destructiveText: {
    color: '#ffffff',
  },
  outlineText: {
    color: '#0f172a',
  },
  secondaryText: {
    color: '#0f172a',
  },
  ghostText: {
    color: '#0f172a',
  },
  linkText: {
    color: '#0f172a',
    textDecorationLine: 'underline',
  },
  size_defaultText: {
    fontSize: 14,
  },
  size_smText: {
    fontSize: 13,
  },
  size_lgText: {
    fontSize: 16,
  },
  size_iconText: {
    fontSize: 0,
  },
  disabledText: {
    opacity: 0.5,
  },
  loader: {
    marginRight: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const exampleStyles = StyleSheet.create({
  buttonContainer: {
    gap: 16,
    paddingHorizontal: 24,
  },
  authButton: {
    height: 24,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    flexGrow: 1,
    flexBasis: 0,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  buttonIcon: {
    marginRight: 12,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  floatingButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    borderColor: '#3AB75C',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  policyContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  readButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  readButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  confirmButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    borderColor: '#3AB75C',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
