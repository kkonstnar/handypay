import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import ArrowSvg from '../../../assets/arrow.svg';
import IPhoneGreySvg from '../../../assets/IPhone_12_Pro_Line_Grey.svg';
import Button from '../../components/ui/Button';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
// import * as Notifications from 'expo-notifications';
import { useUser } from '../../contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
// import { NotificationService } from '../../services/notificationService';

export type NotificationsPageProps = NativeStackScreenProps<RootStackParamList, 'NotificationsPage'>;

export default function NotificationsPage({ navigation }: NotificationsPageProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { clearUser, user } = useUser();
  const [isEnabling, setIsEnabling] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<string | null>(null);

  // TODO: Re-enable notification setup when push notifications are working
  useEffect(() => {
    // const setupNotifications = async () => {
    //   // Check current permission status
    //   const { status } = await Notifications.getPermissionsAsync();
    //   setCurrentPermission(status);
    //   console.log('🔍 Current notification permission:', status);

    //   // Initialize notification handler
    //   NotificationService.initializeNotificationHandler();

    //   // Set up notification listeners
    //   const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    //     console.log('🔔 Notification received:', notification);
    //   });

    //   const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    //     console.log('🔔 Notification response:', response);
    //   });

    //   return () => {
    //     notificationReceivedSubscription.remove();
    //     notificationResponseSubscription.remove();
    //   };
    // };

    // setupNotifications();
    
    // For now, just set a mock permission status
    setCurrentPermission('undetermined');
  }, []);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // TODO: Re-enable when push notifications are working
    try {
      // Mock success for now
      console.log('✅ Notifications setup mocked as successful');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate directly to next screen
      navigation.navigate('FeaturesPage');
      
      // Original notification setup code (commented out):
      // const result = await NotificationService.setupNotifications();
      // if (result.success) {
      //   console.log('✅ Notifications setup completed successfully');
      //   await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      //   navigation.navigate('FeaturesPage');
      // } else {
      //   console.log('❌ Notification permissions denied');
      //   Alert.alert(
      //     'Notifications Not Enabled',
      //     'You can still use HandyPay, but you won\'t receive instant payment alerts. You can enable notifications later in Settings.',
      //     [
      //       { text: 'Continue Anyway', onPress: () => navigation.navigate('FeaturesPage') },
      //       { text: 'Try Again', onPress: () => handleEnableNotifications() }
      //     ]
      //   );
      // }
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
      Alert.alert(
        'Error',
        'Unable to enable notifications. You can try again later in Settings.',
        [
          { text: 'Continue', onPress: () => navigation.navigate('FeaturesPage') }
        ]
      );
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSkipForNow = async () => {
    console.log('⏭️ User chose to skip notifications');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // TODO: Re-enable when notifications are working
    // await NotificationService.saveNotificationPreferences(false);

    // Navigate to the next page without enabling notifications
    navigation.navigate('FeaturesPage');
  };

  const handleBackPress = async () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleBackPress}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ArrowSvg width={24} height={24} />
        </Button>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Phone illustration with notifications icon */}
        <View style={styles.visualSection}>
          <View style={{ position: 'relative', alignItems: 'center' }}>
            <IPhoneGreySvg width={280} height={210} />
            <View style={styles.notificationContainer}>
              <Image 
                source={require('../../../assets/notifications.png')} 
                style={styles.notificationImage}
                resizeMode="contain"
              />
            </View>
            <LinearGradient
              colors={["rgba(255,255,255,1)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0)"]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={styles.gradientWrap}
            />
          </View>
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={styles.headline}>
            Get notified about your payments
          </Text>
          <Text style={styles.subText}>
            Get instant alerts when payments are received or declined.
          </Text>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <Button
          style={currentPermission === 'granted' ? [styles.enableButton, styles.continueButton] : styles.enableButton}
          textStyle={currentPermission === 'granted' ? [styles.enableButtonText, styles.continueButtonText] : styles.enableButtonText}
          onPress={currentPermission === 'granted' ? () => navigation.navigate('FeaturesPage') : handleEnableNotifications}
          disabled={isEnabling}
        >
          {isEnabling ? 'Enabling...' : currentPermission === 'granted' ? 'Continue' : 'Enable Notifications'}
        </Button>
        
        <Button
          variant="ghost"
          style={styles.skipButton}
          textStyle={styles.skipButtonText}
          onPress={handleSkipForNow}
          disabled={isEnabling}
        >
          Skip for now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  visualSection: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    marginBottom: 48,
  },
  gradientWrap: {
    position: 'absolute',
    bottom: -6,
    top: 120,
    left: -70,
    right: -150,
    height: 110,
  },
  notificationContainer: {
    position: 'absolute',
    top: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationImage: {
    width: 350,
    height: 100,
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Coolvetica',
  },
  subText: {
    fontSize: 16,
    fontFamily: 'DMSans-Medium',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  enableButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    borderColor: '#3AB75C',
  },
  continueButton: {
    backgroundColor: '#3AB75C', // Slightly different green for continue state
    borderColor: '#10B981',
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'DMSans-SemiBold',
    color: '#ffffff',
  },
  continueButtonText: {
    color: '#ffffff',
  },
  skipButton: {
    height: 44,
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'DMSans-SemiBold',
    color: '#6b7280',
  },
});