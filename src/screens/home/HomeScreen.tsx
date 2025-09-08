import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, Clipboard, Share, Modal, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AppleSvg from '../../../assets/apple.svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import SwipeButton from 'rn-swipe-button';
import ArrowSvg from '../../../assets/arrow.svg';
import HomeSvg from '../../../assets/home.svg';

import ApplePaySvg from '../../../assets/apple-pay.svg';
import Avatar from '../../components/ui/Avatar';
import NumberPad from '../../components/ui/NumberPad';
import FeeToggle from '../../components/ui/FeeToggle';
import PaymentModal from '../../components/modals/PaymentModal';
import PaymentLinkModal from '../../components/modals/PaymentLinkModal';
import AccountModal from '../../components/modals/AccountModal';
import { useUser, getUserInitials, getUserDisplayName, UserData } from '../../contexts/UserContext';
import { BiometricAuthService } from '../../services';

import ReportBugModal from '../../components/modals/ReportBugModal';
import LanguageModal from '../../components/modals/LanguageModal';
import LegalModal from '../../components/modals/LegalModal';
import AuthenticationMethodModal from '../../components/modals/AuthenticationMethodModal';
import SafetyPinModal from '../../components/modals/SafetyPinModal';
import { useTransactions } from '../../contexts/TransactionContext';
import Svg, { Path } from 'react-native-svg';

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDisplayAmount(displayAmount: string, decimalPart: string, isEntering: boolean, isDecimalMode: boolean): string {
  if (!isEntering) {
    return '0';
  }

  // Remove leading zeros from integer part (but keep at least one digit)
  const cleanDisplayAmount = displayAmount.replace(/^0+/, '') || '0';

  // Add commas to the display amount for readability
  const formattedAmount = cleanDisplayAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (isDecimalMode) {
    return `${formattedAmount}.${decimalPart}`;
  }

  return `${formattedAmount}.00`;
}


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { addTransaction, transactions } = useTransactions();
  const [amount, setAmount] = useState<number>(0);
  const [displayAmount, setDisplayAmount] = useState<string>('0');
  const [isEntering, setIsEntering] = useState<boolean>(false);
  const [decimalPart, setDecimalPart] = useState<string>('00');
  const [isDecimalMode, setIsDecimalMode] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('JMD');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [swipeButtonKey, setSwipeButtonKey] = useState<number>(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [sendWithoutFees, setSendWithoutFees] = useState<boolean>(false);

  const { user, updateSafetyPin, clearUser, updateFaceIdEnabled, cacheAvatar, cachedAvatarUri } = useUser();

  const [showReportBugModal, setShowReportBugModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showAuthenticationMethodModal, setShowAuthenticationMethodModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSafetyPinModal, setShowSafetyPinModal] = useState(false);
  const [showSafetyPinVerifyModal, setShowSafetyPinVerifyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [currentAuthMethod, setCurrentAuthMethod] = useState<'apple' | 'google'>(user?.authProvider || 'apple');

  // Cache onboarding status to avoid checking on every swipe
  const [onboardingStatus, setOnboardingStatus] = useState<{
    isChecking: boolean;
    isComplete: boolean;
    hasAccount: boolean;
    lastChecked: number | null;
  }>({
    isChecking: false,
    isComplete: false,
    hasAccount: false,
    lastChecked: null
  });

  // Check onboarding status when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      checkOnboardingStatus();
    }
  }, [user?.id]);

  // Cache avatar globally when user data is available
  useEffect(() => {
    if (user?.avatarUri && !cachedAvatarUri) {
      if (__DEV__) {
        console.log('🏠 HomeScreen: Caching avatar for global use:', user.avatarUri);
      }
      cacheAvatar(user.avatarUri);
    }
  }, [user?.avatarUri, cachedAvatarUri, cacheAvatar]);

  // Function to check onboarding status from backend
  const checkOnboardingStatus = async () => {
    if (!user?.id) return;

    // Don't check if we recently checked (within last 5 minutes)
    const now = Date.now();
    if (onboardingStatus.lastChecked && (now - onboardingStatus.lastChecked) < 300000) {
      console.log('⏰ Using cached onboarding status (checked recently)');
      return;
    }

    // Remove loading state - check silently in background
    // setOnboardingStatus(prev => ({ ...prev, isChecking: true }));

    try {
      // Only log in development mode to reduce console spam
      if (__DEV__) {
        console.log('🔐 Checking backend onboarding status on mount...');
      }
      const response = await fetch(
        `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${user.id}`
      );

      if (response.ok) {
        const backendData = await response.json();
        // Only log in development mode to reduce console spam
        if (__DEV__) {
          console.log('📊 Cached backend onboarding status:', {
            hasAccount: !!backendData.stripe_account_id,
            onboardingCompleted: backendData.stripe_onboarding_completed,
            lastChecked: new Date(now).toLocaleTimeString()
          });
        }

        setOnboardingStatus({
          isChecking: false,
          isComplete: !!backendData.stripe_onboarding_completed,
          hasAccount: !!backendData.stripe_account_id,
          lastChecked: now
        });
      } else {
        console.error('❌ Failed to check cached onboarding status:', response.status);
        // setOnboardingStatus(prev => ({ ...prev, isChecking: false }));
      }
    } catch (error) {
      console.error('❌ Error checking cached onboarding status:', error);
      // setOnboardingStatus(prev => ({ ...prev, isChecking: false }));
    }
  };

  // Reset swipe button when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      setSwipeButtonKey(prev => prev + 1);
      // Reset amount display state
      setAmount(0);
      setDisplayAmount('0');
      setIsEntering(false);
      setDecimalPart('00');
      setIsDecimalMode(false);
      setSendWithoutFees(false);

      // Refresh onboarding status when returning to screen (in case user just completed onboarding)
      if (user?.id) {
        console.log('🔄 Refreshing onboarding status on screen focus...');
        checkOnboardingStatus();
      }
    }, [user?.id])
  );


  
  // Get current exchange rate with caching
  const getExchangeRate = async (): Promise<number> => {
    try {
      // Try to get fresh rate from API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        const rate = data.rates.JMD;
        // Cache the rate for offline use
        await AsyncStorage.setItem('usd_to_jmd_rate', rate.toString());
        await AsyncStorage.setItem('rate_timestamp', Date.now().toString());
        return rate;
      }
    } catch (error) {
      console.log('Exchange rate API failed, using cached rate');
    }

    // Fallback to cached rate or default
    try {
      const cachedRate = await AsyncStorage.getItem('usd_to_jmd_rate');
      const rateTimestamp = await AsyncStorage.getItem('rate_timestamp');

      if (cachedRate && rateTimestamp) {
        const age = Date.now() - parseInt(rateTimestamp);
        // Use cached rate if less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
          return parseFloat(cachedRate);
        }
      }
    } catch (error) {
      console.log('Failed to get cached rate');
    }

    // Final fallback
    return 156; // Default rate
  };

  const handleConfirm = async () => {
    // Only log in development mode to reduce console spam
    if (__DEV__) {
      console.log('🚀 handleConfirm called!');
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Only log cached status in development mode
    if (__DEV__) {
      console.log('⚡ Using cached onboarding status:', {
        isComplete: onboardingStatus.isComplete,
        hasAccount: onboardingStatus.hasAccount
      });
    }

    if (!user?.id) {
      // Only log errors in development mode
      if (__DEV__) {
        console.log('❌ No user ID available');
      }
      Alert.alert('Error', 'Please sign in again');
      // Reset swipe button after alert
      setTimeout(() => {
        setSwipeButtonKey(prev => prev + 1);
      }, 100);
      return;
    }

    // Check cached onboarding status first
    if (!onboardingStatus.hasAccount) {
      // Only log in development mode
      if (__DEV__) {
        console.log('❌ No Stripe account found (cached)');
      }
      Alert.alert(
        'Complete Setup First',
        'You need to finish your Stripe onboarding before you can start accepting payments. Would you like to continue setup now?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Reset swipe button after alert
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          },
          {
            text: 'Continue Setup',
            onPress: () => {
              navigation.navigate('GetStartedPage');
              // Reset swipe button after navigation
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          }
        ]
      );
      return;
    }

    if (!onboardingStatus.isComplete) {
      // Only log in development mode
      if (__DEV__) {
        console.log('❌ Onboarding not completed (cached)');
      }

      // If status is stale (older than 5 minutes), refresh it
      const now = Date.now();
      if (!onboardingStatus.lastChecked || (now - onboardingStatus.lastChecked) > 300000) {
        // Only log in development mode
        if (__DEV__) {
          console.log('🔄 Cached status is stale, refreshing...');
        }
        await checkOnboardingStatus();

        // Re-check after refresh
        if (!onboardingStatus.isComplete) {
          Alert.alert(
            'Complete Setup First',
            'You need to finish your Stripe onboarding before you can start accepting payments. Would you like to continue setup now?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  // Reset swipe button after alert
                  setTimeout(() => {
                    setSwipeButtonKey(prev => prev + 1);
                  }, 100);
                }
              },
              {
                text: 'Continue Setup',
                onPress: () => {
                  navigation.navigate('GetStartedPage');
                  // Reset swipe button after navigation
                  setTimeout(() => {
                    setSwipeButtonKey(prev => prev + 1);
                  }, 100);
                }
              }
            ]
          );
          return;
        }
      } else {
        Alert.alert(
          'Complete Setup First',
          'You need to finish your Stripe onboarding before you can start accepting payments. Would you like to continue setup now?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Reset swipe button after alert
                setTimeout(() => {
                  setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          },
          {
            text: 'Continue Setup',
            onPress: () => {
              navigation.navigate('GetStartedPage');
              // Reset swipe button after navigation
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          }
        ]
      );
      return;
      }
    }

    // Onboarding is complete according to cache
    // Only log success in development mode
    if (__DEV__) {
      console.log('✅ Onboarding verified (cached), proceeding with payment');
    }

    // Check if user needs to set up authentication before proceeding
    if (!user?.faceIdEnabled && !user?.safetyPinEnabled) {
      Alert.alert(
        'Set Up Security',
        'To confirm payments, you need to set up either Face ID or a Safety PIN for security.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Reset swipe button after alert
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          },
          {
            text: 'Set PIN',
            onPress: () => {
              setShowSafetyPinModal(true);
              // Reset swipe button
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          },
          {
            text: 'Use Face ID',
            onPress: async () => {
              // Check if Face ID is available on this device
              const biometricInfo = await BiometricAuthService.getBiometricInfo();
              if (biometricInfo.isAvailable && biometricInfo.isEnrolled) {
                // Enable Face ID and continue
                await updateFaceIdEnabled(true);
                // Continue with payment flow
                setTimeout(() => handleConfirm(), 500);
              } else {
                Alert.alert(
                  'Face ID Not Available',
                  'Face ID is not available on this device. Please set up a Safety PIN instead.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Set PIN',
                      onPress: () => {
                        setShowSafetyPinModal(true);
                      }
                    }
                  ]
                );
              }
              // Reset swipe button
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          }
        ]
      );
      return;
    }

    // Validate minimum amount for Stripe (must be at least ~$0.50 USD)
    const MINIMUM_USD = 1.00; // $1.00 USD minimum

    const exchangeRate = await getExchangeRate();

    let minimumAmount: number;
    let minimumDisplay: string;

    if (currency === 'USD') {
      minimumAmount = MINIMUM_USD; // $1.00 USD
      minimumDisplay = `$${MINIMUM_USD.toFixed(2)} USD`;
    } else {
      // For JMD, convert USD minimum to JMD equivalent
      minimumAmount = MINIMUM_USD * exchangeRate;
      minimumDisplay = `$${minimumAmount.toFixed(2)} JMD ($${MINIMUM_USD.toFixed(2)} USD)`;
    }

    if (amount < minimumAmount) {
      Alert.alert(
        'Amount Too Low',
        `The minimum payment amount is ${minimumDisplay} to meet Stripe's processing requirements.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset the swipe button after alert is dismissed
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          }
        ]
      );
      return;
    }

    // Check if device is online for Stripe operations
    // Note: This is just for user feedback - actual network calls will handle offline gracefully
    console.log('Payment confirmed for $' + amount.toFixed(2) + '!');
    setShowPaymentModal(true);
  };

  const handleKeyPress = async (key: string) => {
    // Visual feedback first (immediate)
    setPressedKey(key);
    
    // Haptic feedback (don't await - run concurrently)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Clear visual feedback quickly
    setTimeout(() => setPressedKey(null), 100);
    
    if (key === '⌫') {
      handleBackspace();
    } else if (key === '.') {
      handleDecimalPoint();
    } else {
      handleNumberInput(key);
    }
  };

  const handleBackspace = () => {
    if (!isEntering) return;
    
    if (isDecimalMode) {
      if (decimalPart === '00') {
        // No decimal digits to remove, exit decimal mode and continue with integer
        setIsDecimalMode(false);
        // Don't return here - continue to integer backspace logic below
      } else if (decimalPart.endsWith('0')) {
        // Remove the first decimal digit (second position is 0)
        setDecimalPart('00');
        const newAmount = parseFloat(displayAmount + '.00');
        setAmount(newAmount);
        return;
      } else {
        // Remove the second decimal digit
        setDecimalPart(prev => prev.slice(0, 1) + '0');
        const newDecimalPart = decimalPart.slice(0, 1) + '0';
        const newAmount = parseFloat(displayAmount + '.' + newDecimalPart);
        setAmount(newAmount);
        return;
      }
    }
    
    // Handle integer part backspace (also reached when exiting decimal mode)
    if (displayAmount.length === 1) {
      // Last digit, reset everything
      setDisplayAmount('0');
      setIsEntering(false);
      setAmount(0);
    } else {
      const newDisplayAmount = displayAmount.slice(0, -1);
      setDisplayAmount(newDisplayAmount);
      const newAmount = parseFloat(newDisplayAmount + '.00');
      setAmount(newAmount);
    }
  };

  const handleDecimalPoint = () => {
    if (!isEntering) return;
    
    // Enter decimal mode - user can now enter decimal digits
    setIsDecimalMode(true);
    setDecimalPart('00'); // Reset decimal part when entering decimal mode
  };

  const handleNumberInput = (key: string) => {
    if (!isEntering) {
      // First digit entered - prevent leading zeros
      if (key === '0') {
        return; // Don't allow leading zeros
      }
      setDisplayAmount(key);
      setIsEntering(true);
      const newAmount = parseFloat(key + '.00');
      setAmount(newAmount);
      return;
    }
    
    if (isDecimalMode) {
      // Add digit to decimal part
      if (decimalPart === '00') {
        setDecimalPart(key + '0');
      } else if (decimalPart.endsWith('0')) {
        setDecimalPart(decimalPart.slice(0, 1) + key);
      }
      
      // Update amount with new decimal
      const newDecimalPart = decimalPart === '00' ? key + '0' : 
                             decimalPart.endsWith('0') ? decimalPart.slice(0, 1) + key : decimalPart;
      const newAmount = parseFloat(displayAmount + '.' + newDecimalPart);
      setAmount(newAmount);
    } else {
      // Add digit to integer part
      const newDisplayAmount = displayAmount + key;
      setDisplayAmount(newDisplayAmount);
      const newAmount = parseFloat(newDisplayAmount + '.00');
      setAmount(newAmount);
    }
  };


  const handleAvatarPress = () => {
    console.log('Avatar pressed!');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAccountModal(true);
  };



  const closeAccountModal = () => {
    setShowAccountModal(false);
  };

  const handleShowSafetyPin = () => {
    setShowSafetyPinModal(true);
  };

  const handleLogoutWithAuth = async () => {
    // This handles logout when Safety PIN is enabled
    const performLogout = async () => {
      try {
        await clearUser();
        setShowAuthenticationMethodModal(false);
        // Navigate to StartPage after successful logout
        navigation.reset({
          index: 0,
          routes: [{ name: 'StartPage' }],
        });
        Toast.show({
          type: 'success',
          text1: 'Logged out successfully',
        });
      } catch (error) {
        console.error('Logout error:', error);
        Alert.alert('Error', 'Failed to log out. Please try again.');
      }
    };

    await authenticateUser(
      performLogout,
      'Authenticate to log out'
    );
  };

  const handleDeleteAccountWithAuth = async () => {
    // This handles account deletion when Safety PIN is enabled
    const performDelete = async () => {
      console.log('🗑️ Performing account deletion with PIN auth...');

      // ADD CONFIRMATION ALERT AFTER AUTHENTICATION
      Alert.alert(
        'Delete Account',
        'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be removed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('🛑 Account deletion cancelled by user');
              // Reset swipe button after alert
              setTimeout(() => {
                setSwipeButtonKey(prev => prev + 1);
              }, 100);
            }
          },
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: async () => {
              await executeAccountDeletion();
            }
          }
        ]
      );
    };

    const executeAccountDeletion = async () => {
      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      setDeletingAccount(true);

      try {
        console.log(`🗑️ Deleting account for user: ${user.id}`);

        // Account deletion endpoint doesn't require authentication (protected by biometric/PIN on frontend)
        const response = await fetch(
          `https://handypay-backend.handypay.workers.dev/api/users/${user.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          try {
            const result = await response.json();
            console.log('✅ Account deletion successful:', result);
          } catch (jsonError) {
            // If response is not JSON, still treat as success
            console.log('✅ Account deletion successful (non-JSON response)');
          }

          // Clear local user data
          await clearUser();

          // Close modal and navigate to start page
          setShowAuthenticationMethodModal(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'StartPage' }],
          });

          Toast.show({
            type: 'success',
            text1: 'Account deleted successfully',
            text2: 'All your data has been removed',
          });
        } else {
          let errorMessage = 'Failed to delete account';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If response is not JSON, get text response
            const textResponse = await response.text();
            console.error('❌ Non-JSON error response:', textResponse);
            if (textResponse.includes('Not Found') || textResponse.includes('404')) {
              errorMessage = 'Delete endpoint not found. Backend needs to be redeployed.';
            } else if (textResponse.includes('Internal Server Error')) {
              errorMessage = 'Server error. Please try again later.';
            }
          }
          console.error('❌ Account deletion failed:', errorMessage);
          Alert.alert('Error', errorMessage);
        }
      } catch (error) {
        console.error('❌ Account deletion error:', error);
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      } finally {
        setDeletingAccount(false);
      }
    };

    await authenticateUser(
      performDelete,
      'Authenticate to delete account'
    );
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    // Reset swipe button when modal closes
    setSwipeButtonKey(prev => prev + 1);
  };

  // Authentication handler that uses either Face ID or Safety PIN based on user preferences
  const authenticateUser = async (action: () => void, message: string) => {
    try {
      // First check if Face ID is enabled AND actually available on device
      if (user?.faceIdEnabled) {
        const biometricInfo = await BiometricAuthService.getBiometricInfo();

        if (biometricInfo.isAvailable && biometricInfo.isEnrolled) {
          // Face ID is enabled and available, use it
          const authSuccess = await BiometricAuthService.authenticateWithPrompt(
            message,
            {
              showErrorAlert: true,
              allowRetry: true,
              onSuccess: action,
              onError: (error: string) => {
                // Reset swipe button if authentication fails
                console.log('Biometric auth error:', error);
                setTimeout(() => {
                  setSwipeButtonKey(prev => prev + 1);
                }, 100);
              },
              onCancel: () => {
                // Reset swipe button if user cancels authentication
                console.log('Biometric auth cancelled');
                setTimeout(() => {
                  setSwipeButtonKey(prev => prev + 1);
                }, 100);
              }
            }
          );

          // If authentication failed or was cancelled, don't proceed with the action
          if (!authSuccess) {
            return;
          }

          // If Face ID authentication succeeded, we're done - return early
          return;
        }
      }

      // If Face ID is disabled, try device passcode first, then Safety PIN
      const deviceBiometricInfo = await BiometricAuthService.getBiometricInfo();

      if (!user?.faceIdEnabled && deviceBiometricInfo.isAvailable) {
        // Face ID is disabled but device has biometric/passcode capability
        // Allow device passcode authentication
        const authSuccess = await BiometricAuthService.authenticateWithPrompt(
          message,
          {
            showErrorAlert: true,
            allowRetry: true,
            allowPasscodeFallback: true,
            onSuccess: action,
            onError: (error: string) => {
              console.log('Device passcode auth error:', error);
              setTimeout(() => setSwipeButtonKey(prev => prev + 1), 100);
            },
            onCancel: () => {
              console.log('Device passcode auth cancelled');
              setTimeout(() => setSwipeButtonKey(prev => prev + 1), 100);
            }
          }
        );

        // If authentication failed or was cancelled, don't proceed with the action
        if (!authSuccess) {
          return;
        }

        // If device passcode authentication succeeded, we're done - return early
        return;
      } else if (user?.safetyPinEnabled) {
        // Use Safety PIN authentication as fallback
        console.log('🔐 Falling back to Safety PIN authentication');
        setPendingAction(() => action);
        setShowSafetyPinVerifyModal(true);
        // Don't return here - the PIN modal will handle the action when verified
      } else if (!user?.faceIdEnabled && !user?.safetyPinEnabled) {
        // No authentication methods enabled, proceed directly
        console.log('⚠️ No authentication methods enabled, proceeding directly');
        action();
      } else {
        // Fallback: if we reach here, something went wrong with the logic
        console.log('⚠️ Authentication fallback triggered');
        action(); // Last resort
      }
    } catch (error) {
      // If authentication fails for any reason, reset the swipe button
      console.error('Authentication error:', error);
      setTimeout(() => {
        setSwipeButtonKey(prev => prev + 1);
      }, 100);
    }
  };

  const handleScanToPay = () => {
    setShowPaymentModal(false);
    // Reset swipe button when navigating away
    setSwipeButtonKey(prev => prev + 1);
    navigation.navigate('ScanToPay', { amount, currency });
  };

  const handlePaymentLink = () => {
    setShowPaymentModal(false);
    setShowPaymentLinkModal(true);
    // Reset swipe button when opening another modal
    setSwipeButtonKey(prev => prev + 1);
  };

  const closePaymentLinkModal = () => {
    setShowPaymentLinkModal(false);
    // Reset swipe button when modal closes
    setSwipeButtonKey(prev => prev + 1);
  };

  const handleCopyPaymentLink = async (paymentLink?: string) => {
    const linkToCopy = paymentLink || `https://handypay.com/pay?amount=${amount.toFixed(2)}&currency=${currency}&id=${Date.now()}`;
    try {
      await Clipboard.setString(linkToCopy);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Note: Transaction is created by backend when payment link is generated
      // No need to create duplicate local transaction

      Alert.alert('Copied!', 'Payment link has been copied to your clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link to clipboard');
    }
  };

  const handleSharePaymentLink = async (paymentLink?: string) => {
    const linkToShare = paymentLink || `https://handypay.com/pay?amount=${amount.toFixed(2)}&currency=${currency}&id=${Date.now()}`;
    try {
      await Share.share({
        message: `Pay $${amount.toFixed(2)} ${currency} using this secure link: ${linkToShare}`,
        title: 'Payment Request'
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Note: Transaction is created by backend when payment link is generated
      // No need to create duplicate local transaction

      Alert.alert('Shared!', 'Payment link has been shared');
    } catch (error) {
      console.error('Error sharing payment link:', error);
      Alert.alert('Error', 'Failed to share payment link');
    }
  };


  const handleBankAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Connected Bank Account',
      'Chase Bank - Checking\nAccount ending in ****2847\n\nLast verified: Jan 10, 2024',
      [
        { text: 'OK', style: 'default' },
        { text: 'Manage', onPress: () => Alert.alert('Manage Account', 'Bank account management coming soon') }
      ]
    );
  };

  const keypad = useMemo(
    () => [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['.', '0', '⌫'],
    ],
    []
  );

  return (
    <GestureHandlerRootView style={[styles.container, { paddingTop: insets.top + 16 }]}>

      {/* Header */}
      <View style={[styles.headerRow, { paddingHorizontal: 24 }]}>
        <View />
        <TouchableOpacity 
          onPress={handleAvatarPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <Avatar 
            initials={getUserInitials(user)}
            imageUri={user?.avatarUri}
          />
        </TouchableOpacity>
      </View>

      {/* Currency Selector */}
      <View style={styles.currencySection}>
        <TouchableOpacity 
          style={styles.currencySelector}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert(
              'Select Currency',
              'Choose your preferred currency',
              [
                {
                  text: 'JMD - Jamaican Dollar',
                  onPress: () => {
                    setCurrency('JMD');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                },
                {
                  text: 'USD - US Dollar', 
                  onPress: () => {
                    setCurrency('USD');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                }
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.currencyText}>{currency}</Text>
          <Ionicons name="chevron-down" size={12} color="#9ca3af" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <View style={styles.amountContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <Text style={styles.amount}>{formatDisplayAmount(displayAmount, decimalPart, isEntering, isDecimalMode)}</Text>
        </View>
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        {keypad.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}> 
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key, 
                  key === '⌫' && styles.backspaceKey,
                  pressedKey === key && styles.keyPressed
                ]}
                activeOpacity={1}
                onPress={() => handleKeyPress(key)}
              >
                {key === '⌫' ? (
                  <View style={[
                    styles.backspaceButton,
                    pressedKey === key && styles.backspacePressed
                  ]}>
                    <Ionicons name="backspace-outline" size={22} color="#111827" />
                  </View>
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Swipe Button - positioned above tab bar */}
      <View style={[styles.bottomSection, { paddingHorizontal: 24, paddingBottom: 20 }]}>
        {/* Fee Toggle - above swipe to confirm */}
        {isEntering && amount > 0 && (
          <View style={styles.feeToggleContainer}>
            <FeeToggle
              amount={amount}
              currency={currency}
              sendWithoutFees={sendWithoutFees}
              onToggle={setSendWithoutFees}
            />
          </View>
        )}
        
        <SwipeButton
          key={swipeButtonKey}
          title="Swipe to confirm"
          titleColor="#6b7280"
          titleFontSize={16}
          railBackgroundColor="#e5e7eb"
          railFillBackgroundColor="#3AB75C"
          height={46}
          thumbIconWidth={48}
          thumbIconHeight={48}
          railBorderColor="transparent"
          railStyles={{
            backgroundColor: '#3AB75C',
            borderColor: '#3AB75C',
            borderWidth: 3,
            borderRadius: 24,
          }}
          thumbIconBackgroundColor="#ffffff"
          thumbIconBorderColor="transparent"
          thumbIconComponent={() => (
            <View style={styles.swipeThumb}>
              <ArrowSvg width={18} height={18} color="#3AB75C" style={{ transform: [{ rotate: '180deg' }] }} />
            </View>
          )}
          onSwipeSuccess={handleConfirm}
          shouldResetAfterSuccess={false}
          swipeSuccessThreshold={70}
        />
      </View>

      {/* Account Modal */}
      <AccountModal
        visible={showAccountModal}
        onClose={closeAccountModal}
        userName={getUserDisplayName(user)}
        userInitials={getUserInitials(user)}
        memberSince={user?.memberSince ? new Date(user.memberSince).toLocaleDateString() : undefined}
        currentAuthMethod={user?.authProvider || 'apple'}
        onShowReportBug={() => setShowReportBugModal(true)}
        onShowLanguage={() => setShowLanguageModal(true)}
        onShowLegal={() => setShowLegalModal(true)}
        onShowAuthenticationMethod={async () => {
          closeAccountModal();
          await authenticateUser(
            () => setShowAuthenticationMethodModal(true),
            'Authenticate to access password & security settings'
          );
        }}
        onShowSafetyPin={handleShowSafetyPin}
        userAvatar={user?.avatarUri}
        onAvatarUpdate={(imageUri: string) => {
          // Avatar update is already handled by the AccountModal itself via updateAvatarUri
          console.log('Avatar updated:', imageUri);
        }}
      />

      <ReportBugModal 
        visible={showReportBugModal} 
        onClose={() => setShowReportBugModal(false)} 
      />

      <LanguageModal 
        visible={showLanguageModal} 
        onClose={() => setShowLanguageModal(false)} 
      />

      <LegalModal 
        visible={showLegalModal} 
        onClose={() => setShowLegalModal(false)} 
      />

      {/* Payment Options Modal */}
      <PaymentModal
        visible={showPaymentModal}
        amount={amount}
        currency={currency}
        onClose={closePaymentModal}
        onQRPress={async () => {
          closePaymentModal();
          await authenticateUser(
            () => navigation.navigate('ScanToPay', { amount, currency }),
            'Authenticate to generate QR code'
          );
        }}
        onPaymentLinkPress={async () => {
          closePaymentModal();
          await authenticateUser(
            () => setShowPaymentLinkModal(true),
            'Authenticate to create payment link'
          );
        }}
      />

      {/* Payment Link Modal */}
      <PaymentLinkModal
        visible={showPaymentLinkModal}
        amount={amount}
        currency={currency}
        onClose={closePaymentLinkModal}
        onCopyLink={handleCopyPaymentLink}
        onShareLink={handleSharePaymentLink}
      />

      <AuthenticationMethodModal
        visible={showAuthenticationMethodModal}
        onClose={() => setShowAuthenticationMethodModal(false)}
        currentMethod={currentAuthMethod}
        onShowSafetyPin={handleShowSafetyPin}
        onMethodChange={setCurrentAuthMethod}
        onLogoutWithAuth={handleLogoutWithAuth}
        onDeleteAccountWithAuth={handleDeleteAccountWithAuth}
      />

      <SafetyPinModal
        visible={showSafetyPinModal}
        onClose={() => setShowSafetyPinModal(false)}
        mode="setup"
        onPinSet={async (pin) => {
          try {
            console.log('PIN set:', pin);
            await updateSafetyPin(pin);
            Alert.alert('PIN Set', 'Your safety PIN has been successfully set up!');
            setShowSafetyPinModal(false);
          } catch (error) {
            console.error('Error setting PIN:', error);
            Alert.alert('Error', 'Failed to save your safety PIN. Please try again.');
          }
        }}
      />

      <SafetyPinModal
        visible={showSafetyPinVerifyModal}
        onClose={() => {
          setShowSafetyPinVerifyModal(false);
          setPendingAction(null);
          // Reset swipe button when safety pin modal is closed
          setTimeout(() => {
            setSwipeButtonKey(prev => prev + 1);
          }, 100);
        }}
        mode="verify"
        onVerificationSuccess={() => {
          setShowSafetyPinVerifyModal(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
        title="Enter Safety PIN"
        subtitle="Enter your 6-digit Safety PIN to continue"
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  currencySection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  dollarSign: {
    fontSize: 30,
    fontWeight: '400',
    color: '#111827',
    fontFamily: 'SF-Pro-Rounded-Regular',
    marginRight: 2,
  },
  amount: { 
    fontSize: 30, 
    fontWeight: '600', 
    color: '#111827', 
    textAlign: 'center',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  amountSub: { 
    fontSize: 18, 
    color: '#9ca3af',
    fontWeight: '400',
    marginLeft: 8
  },
  currencyButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    marginLeft: 4
  },
  currencySelector: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  currencyText: { 
    fontSize: 16, 
    fontWeight: '500',
    color: '#374151',
    letterSpacing: 0.3
  },
  feeToggleContainer: {
    paddingHorizontal: 0,
    paddingBottom: 16,
    overflow: 'visible',
    zIndex: 10,
  },
  keypadContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 8 
  },
  key: { 
    width: 70, 
    height: 70, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 40
  },
  keyPressed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  keyText: { 
    fontSize: 22, 
    color: '#111827', 
    fontWeight: '600',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  backspaceKey: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  backspaceButton: {
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backspacePressed: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  bottomSection: {
    marginTop: 'auto'
  },
  swipeThumb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  // Payment Modal styles
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  paymentModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  paymentContent: {
    flex: 1,
    padding: 24
  },
  paymentTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32
  },
  paymentSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22
  },
  paymentOptions: {
    gap: 16
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 6
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  paymentOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  paymentOptionText: {
    flex: 1
  },
  paymentOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  paymentOptionDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18
  },
  // Payment Link Modal styles
  paymentLinkModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  paymentLinkModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  paymentLinkContent: {
    flex: 1,
    padding: 24
  },
  paymentLinkTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32
  },
  paymentLinkSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22
  },
  paymentLinkCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24
  },
  paymentLinkUrlContainer: {
    marginBottom: 20
  },
  paymentLinkUrl: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
    lineHeight: 20
  },
  paymentLinkActions: {
    flexDirection: 'row',
    gap: 16
  },
  paymentLinkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3AB75C',
    gap: 16
  },
  paymentLinkActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3AB75C'
  },
  paymentLinkNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic'
  },
});



