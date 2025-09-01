import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUser } from '../../contexts/UserContext';

interface SafetyPinModalProps {
  visible: boolean;
  onClose: () => void;
  onPinSet?: (pin: string) => void;
  mode?: 'setup' | 'verify';
  onVerificationSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export default function SafetyPinModal({
  visible,
  onClose,
  onPinSet,
  mode = 'setup',
  onVerificationSuccess,
  title,
  subtitle
}: SafetyPinModalProps): React.ReactElement {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [showDigits, setShowDigits] = useState<boolean[]>([]);
  const { verifySafetyPin } = useUser();

  // Reset state when modal becomes visible or mode changes
  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      setIsVerifying(false);
      setShowDigits([]);
      // Auto-focus when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible, mode]);

  const handleSetPin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'verify') {
      // Verification mode
      if (pin.length !== 6) {
        setError('Please enter your 6-digit PIN');
        return;
      }

      setIsVerifying(true);
      setError('');

      try {
        const isValid = await verifySafetyPin(pin);

        if (isValid) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onVerificationSuccess?.();
          handleClose();
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError('Incorrect PIN. Please try again.');
          setPin('');
          setShowDigits([]);
        }
      } catch (error) {
        console.error('PIN verification error:', error);
        setError('Unable to verify PIN. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    } else {
      // Setup mode
      if (step === 'enter') {
        if (pin.length !== 6) {
          setError('Please enter a 6-digit PIN');
          return;
        }

        if (!/^\d{6}$/.test(pin)) {
          setError('PIN must contain only numbers');
          return;
        }

        setStep('confirm');
        setError('');
        setShowDigits([]);
      } else {
        // Confirm step
        if (confirmPin !== pin) {
          setError('PINs do not match. Please try again.');
          return;
        }

        onPinSet?.(pin);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    setStep('enter');
    setError('');
    setIsVerifying(false);
    setShowDigits([]);
    onClose();
  };

  const renderPinBoxes = (pinValue: string) => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFilled = i < pinValue.length;
      const shouldShowDigit = showDigits[i];
      boxes.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pinBox,
            isFilled && styles.pinBoxFilled
          ]}
          onPress={() => {
            // Focus the hidden input when tapping on boxes
            inputRef.current?.focus();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.pinText}>
            {isFilled ? (shouldShowDigit ? pinValue[i] : '●') : ''}
          </Text>
        </TouchableOpacity>
      );
    }
    return boxes;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleClose();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            {title || (mode === 'verify' 
              ? 'Enter Safety PIN'
              : step === 'enter' 
                ? 'Set up safety PIN' 
                : 'Confirm safety PIN'
            )}
          </Text>
          <Text style={styles.subtitle}>
            {subtitle || (mode === 'verify'
              ? 'Enter your 6-digit Safety PIN to continue'
              : step === 'enter'
                ? 'Create a 6-digit PIN for additional security'
                : 'Re-enter your PIN to confirm'
            )}
          </Text>

          <View style={styles.pinDisplay}>
            {renderPinBoxes(mode === 'verify' ? pin : step === 'enter' ? pin : confirmPin)}
          </View>

          {/* Hidden input that captures keyboard input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={mode === 'verify' ? pin : step === 'enter' ? pin : confirmPin}
            onChangeText={async (text) => {
              const cleanText = text.replace(/[^0-9]/g, '').slice(0, 6);
              
              if (mode === 'verify' || step === 'enter') {
                const oldLength = pin.length;
                const newLength = cleanText.length;
                setPin(cleanText);
                
                // Add haptic feedback for digit entry
                if (newLength > oldLength) {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else if (newLength < oldLength) {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                }
                
                // Show the new digit briefly
                if (newLength > oldLength) {
                  const newShowDigits = [...showDigits];
                  newShowDigits[newLength - 1] = true;
                  setShowDigits(newShowDigits);
                  
                  // Hide it after 500ms
                  setTimeout(() => {
                    setShowDigits(prev => {
                      const updated = [...prev];
                      updated[newLength - 1] = false;
                      return updated;
                    });
                  }, 500);
                } else if (newLength < oldLength) {
                  // Remove the digit visibility when deleting
                  const newShowDigits = [...showDigits];
                  newShowDigits.splice(newLength);
                  setShowDigits(newShowDigits);
                }
              } else {
                const oldLength = confirmPin.length;
                const newLength = cleanText.length;
                setConfirmPin(cleanText);
                
                // Add haptic feedback for digit entry in confirm step
                if (newLength > oldLength) {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else if (newLength < oldLength) {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                }
                
                // Show the new digit briefly
                if (newLength > oldLength) {
                  const newShowDigits = [...showDigits];
                  newShowDigits[newLength - 1] = true;
                  setShowDigits(newShowDigits);
                  
                  // Hide it after 500ms
                  setTimeout(() => {
                    setShowDigits(prev => {
                      const updated = [...prev];
                      updated[newLength - 1] = false;
                      return updated;
                    });
                  }, 500);
                } else if (newLength < oldLength) {
                  // Remove the digit visibility when deleting
                  const newShowDigits = [...showDigits];
                  newShowDigits.splice(newLength);
                  setShowDigits(newShowDigits);
                }
              }
              setError('');
            }}
            keyboardType="numeric"
            maxLength={6}
            autoFocus
            caretHidden
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.setPinButton,
              (isVerifying || (mode === 'verify' 
                ? pin.length !== 6 
                : (step === 'enter' && pin.length !== 6) || (step === 'confirm' && confirmPin.length !== 6)
              )) && styles.disabledButton
            ]}
            onPress={handleSetPin}
            activeOpacity={0.7}
            disabled={isVerifying || (mode === 'verify' 
              ? pin.length !== 6 
              : (step === 'enter' && pin.length !== 6) || (step === 'confirm' && confirmPin.length !== 6)
            )}
          >
            <Text style={styles.setPinButtonText}>
              {isVerifying 
                ? 'Verifying...' 
                : mode === 'verify' 
                  ? 'Verify PIN' 
                  : step === 'enter' 
                    ? 'Continue' 
                    : 'Set PIN'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
    flex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -1,
    fontFamily: 'DMSans-SemiBold'
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'DMSans-Medium'
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8
  },
  pinBox: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  pinBoxFilled: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb'
  },
  pinText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'DMSans-SemiBold'
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    fontFamily: 'DMSans-Medium',
    marginBottom: 20
  },
  setPinButton: {
    backgroundColor: '#3AB75C',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    maxWidth: 200,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6
  },
  setPinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans-SemiBold'
  }
});