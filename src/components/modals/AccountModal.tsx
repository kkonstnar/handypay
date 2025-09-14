import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView, Alert, TextInput, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { useUser } from '../../contexts/UserContext';
// import SafetyPinModal from './SafetyPinModal';
// import AuthenticationMethodModal from './AuthenticationMethodModal';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userInitials?: string;
  memberSince?: string;
  currentAuthMethod?: 'apple' | 'google';
  onShowReportBug?: () => void;
  onShowLanguage?: () => void;
  onShowLegal?: () => void;
  onShowAuthenticationMethod?: () => void;
  onShowSafetyPin?: () => void;
  userAvatar?: string;
  onAvatarUpdate?: (imageUri: string) => void;
}

const AppleIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.5 12.5C17.5 10.4 19.2 8.7 21.3 8.7C20.9 7.2 19.4 6.2 17.7 6.2C15.9 6.2 14.9 7.3 14 7.3C13 7.3 11.8 6.3 10.3 6.3C7.4 6.3 4.5 8.9 4.5 13.1C4.5 17.2 7.4 21.7 10.3 21.7C11.8 21.7 12.8 20.7 14.3 20.7C15.8 20.7 16.6 21.7 18.2 21.7C20.9 21.7 23.5 17.8 23.5 13.6C21.4 12.8 17.5 13.8 17.5 12.5Z"
      fill="#111827"
    />
    <Path
      d="M15.2 4.9C16.3 3.6 16.1 1.8 16.1 1.5C14.6 1.6 12.9 2.6 12.1 3.8C11.3 5 11.6 6.7 11.6 7C13.2 7.1 14.7 6.1 15.2 4.9Z"
      fill="#111827"
    />
  </Svg>
);



export default function AccountModal({
  visible,
  onClose,
  userName = "HandyPay User",
  userInitials = "HU",
  memberSince = "Jan 06, 2025",
  currentAuthMethod = "apple",
  onShowReportBug,
  onShowLanguage,
  onShowLegal,
  onShowAuthenticationMethod,
  onShowSafetyPin,
  userAvatar,
  onAvatarUpdate
}: AccountModalProps): React.ReactElement {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { updateAvatarUri, cachedAvatarUri, cacheAvatar } = useUser();

  // Debug logging for avatar caching
  if (__DEV__) {
    console.log('🎭 AccountModal avatar state:', {
      cachedAvatarUri: !!cachedAvatarUri,
      userAvatar: !!userAvatar,
      usingCached: !!cachedAvatarUri,
      usingProp: !cachedAvatarUri && !!userAvatar
    });
  }

  const handleBiometricsToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Biometric Authentication',
      'Toggle biometric authentication for secure access?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Toggle', onPress: () => Alert.alert('Updated', 'Biometric settings updated') }
      ]
    );
  };

  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Get Help',
      'Need assistance with HandyPay? Choose how you\'d like to contact our support team.',
      [
        {
          text: 'Email Support',
          onPress: () => {
            const emailUrl = 'mailto:support@tryhandypay.com?subject=HandyPay Support Request';
            Linking.openURL(emailUrl).catch(() => {
              // If primary email fails, try alternate
              const alternateEmailUrl = 'mailto:support@tryhandypay.com?subject=HandyPay Support Request';
              Linking.openURL(alternateEmailUrl).catch(() => {
                Alert.alert('Email Error', 'Unable to open email client. Please contact support@tryhandypay.com or support@tryhandypay.org manually.');
              });
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLegal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onShowLegal?.();
  };

  const handleReportBug = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onShowReportBug?.();
  };

  const handleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onShowLanguage?.();
  };

  const handleAuthenticationMethod = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onShowAuthenticationMethod?.();
  };




  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Change Profile Picture',
      'Choose how you want to select your profile photo',
      [
        {
          text: 'Camera',
          onPress: () => pickImage(ImagePicker.MediaTypeOptions.Images, 'camera')
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage(ImagePicker.MediaTypeOptions.Images, 'library')
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => removeAvatar()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const pickImage = async (mediaType: ImagePicker.MediaTypeOptions, source: 'camera' | 'library') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: mediaType,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatar
        quality: 0.8,
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Update avatar in user context
        await updateAvatarUri(imageUri);

        // Cache avatar globally for instant display across all screens
        await cacheAvatar(imageUri);

        // Call the optional prop callback if provided
        onAvatarUpdate?.(imageUri);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeAvatar = async () => {
    try {
      await updateAvatarUri('');
      // Clear global cache
      await cacheAvatar('');
      onAvatarUpdate?.('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile picture removed successfully!');
    } catch (error) {
      console.error('Error removing avatar:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    }
  };



  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.accountModalContainer}>
          <View style={styles.accountModalHeader}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.accountModalTitle}>Account</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.accountContent} showsVerticalScrollIndicator={false}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {userName}
                </Text>
                <Text style={styles.profileMember}>
                  Member since: {memberSince}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileAvatarContainer}
                activeOpacity={0.7}
                onPress={handleAvatarPress}
              >
                <View style={styles.profileAvatar}>
                  {cachedAvatarUri || userAvatar ? (
                    <View style={styles.avatarImageContainer}>
                      <Image
                        key={`account-avatar-${cachedAvatarUri || userAvatar}`}
                        source={{ uri: cachedAvatarUri || userAvatar }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                        onError={(error) => {
                          if (__DEV__) {
                            console.error('🎭 AccountModal avatar load error:', error.nativeEvent.error);
                          }
                        }}
                      />
                    </View>
                  ) : (
                    <Text style={styles.profileInitials}>
                      {userInitials}
                    </Text>
                  )}
                </View>
                <View style={styles.avatarEditOverlay}>
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* General Section */}
            <View style={styles.accountSection}>
              <Text style={styles.sectionTitle}>General</Text>
              
              <View style={styles.accountItemsContainer}>
                <TouchableOpacity 
                  style={styles.accountItem} 
                  activeOpacity={0.7}
                  onPress={handleAuthenticationMethod}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={styles.accountIcon}>
                      <Ionicons name="person" size={24} color="#111827" />
                    </View>
                    <View>
                      <Text style={styles.accountItemTitle}>Password & security</Text>
                      <Text style={styles.accountItemSubtitle}>
                        Apple
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.accountItem} 
                  activeOpacity={0.7}
                  onPress={handleLegal}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={styles.accountIcon}>
                      <Ionicons name="document-text" size={24} color="#111827" />
                    </View>
                    <View>
                      <Text style={styles.accountItemTitle}>Legal</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.accountItem} 
                  activeOpacity={0.7}
                  onPress={handleHelp}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={styles.accountIcon}>
                      <Ionicons name="help-circle" size={24} color="#111827" />
                    </View>
                    <View>
                      <Text style={styles.accountItemTitle}>Help</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.accountItem} 
                  activeOpacity={0.7}
                  onPress={handleLanguage}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={styles.accountIcon}>
                      <Ionicons name="language" size={24} color="#111827" />
                    </View>
                    <View>
                      <Text style={styles.accountItemTitle}>Language</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.accountItem, styles.lastAccountItem]}
                  activeOpacity={0.7}
                  onPress={handleReportBug}
                >
                  <View style={styles.accountItemLeft}>
                    <View style={styles.accountIcon}>
                      <Ionicons name="bug" size={24} color="#111827" />
                    </View>
                    <View>
                      <Text style={styles.accountItemTitle}>Report a bug</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            {/* App Info */}
            <View style={styles.appInfoSection}>
              <Text style={styles.appVersion}>v1.0.1</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>


    </>
  );
}

const styles = StyleSheet.create({
  accountModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  accountModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  accountModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-SemiBold'
  },
  accountContent: {
    flex: 1
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomColor: '#f3f4f6'
  },
  profileInfo: {
    flex: 1
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3AB75C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    // Position to show more of the image with less cropping
    position: 'absolute',
    top: -8,
    left: -8,
    // Ensure proper clipping for circular images
    overflow: 'hidden'
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  profileName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 38,
    fontFamily: 'DMSans-SemiBold'
  },
  profileMember: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'DMSans-Medium'
  },
  profileInitials: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'DMSans-Medium',
    color: '#ffffff'
  },
  accountSection: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomColor: '#f3f4f6'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    fontFamily: 'DMSans-SemiBold'
  },
  accountItemsContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb'
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  lastAccountItem: {
    borderBottomWidth: 0
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  accountItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    fontFamily: 'DMSans-SemiBold'
  },
  accountItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'DMSans-Medium'
  },
  appInfoSection: {
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 24
  },
  appVersion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'DMSans-Medium'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium'
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'DMSans-Medium'
  },
  sendText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  },
  modalContent: {
    padding: 16
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'DMSans-Medium'
  },
  bugReportInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'DMSans-Medium',
    minHeight: 120,
    marginBottom: 12
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    fontFamily: 'DMSans-Medium'
  },
  languageContent: {
    flex: 1
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  languageText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'DMSans-Medium'
  },
  legalContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginTop: 32
  },
  legalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  lastLegalOption: {
    borderBottomWidth: 0
  },
  legalOptionText: {
    flex: 1
  },
  legalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'DMSans-Medium'
  },
  legalOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'DMSans-Medium'
  }

});
