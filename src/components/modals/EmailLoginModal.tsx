import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUser } from '../../contexts/UserContext';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface EmailLoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmailLoginModal({ visible, onClose }: EmailLoginModalProps): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, updateLastLogin } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      console.log('🔐 Attempting email login for:', email);

      let userData;

      // Check for test user credentials
      if (email === 'test@example.com' && password === 'test123') {
        console.log('🎯 Test user login detected');

        // Create consistent test user
        userData = {
          id: 'test-user-12345',
          email: 'test@example.com',
          fullName: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          authProvider: 'google' as const, // Use google for compatibility
          appleUserId: null,
          googleUserId: 'test-user-12345',
          stripeAccountId: null,
          stripeOnboardingCompleted: false,
          memberSince: new Date().toISOString(),
          faceIdEnabled: false,
          safetyPinEnabled: false,
          avatarUri: undefined,
        };

        Toast.show({
          type: 'success',
          text1: 'Test user login successful!',
          text2: 'Welcome to HandyPay'
        });
      } else {
        // For demo purposes, we'll create a mock user
        // In a real app, this would validate against your backend
        userData = {
          id: `email_user_${Date.now()}`,
          email: email,
          fullName: email.split('@')[0], // Use email prefix as name
          firstName: email.split('@')[0],
          lastName: '',
          authProvider: 'google' as const, // Use google for compatibility
          appleUserId: null,
          googleUserId: `email_user_${Date.now()}`,
          stripeAccountId: null, // Will go through onboarding flow
          stripeOnboardingCompleted: false,
          memberSince: new Date().toISOString(),
          faceIdEnabled: false,
          safetyPinEnabled: false,
          avatarUri: undefined,
        };

        Toast.show({
          type: 'success',
          text1: 'Login successful!',
          text2: 'Welcome to HandyPay'
        });
      }

      // Save user data
      await setUser(userData);
      await updateLastLogin();

      console.log('✅ Email login successful for:', email);

      // Close modal and navigate to biometrics
      onClose();
      navigation.navigate('BiometricsPage');

    } catch (error) {
      console.error('❌ Email login error:', error);
      Alert.alert('Login Failed', 'Unable to log in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    onClose();
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
            onPress={handleClose}
            activeOpacity={0.7}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign In</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Enter your email and password to continue
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loginButtonText}>Signing in...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: 'DMSans-Medium',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'DMSans-Medium',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3AB75C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'DMSans-SemiBold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'DMSans-Medium',
  },
});
