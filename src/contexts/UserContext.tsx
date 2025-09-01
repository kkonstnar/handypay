import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseUserService } from '../services/SupabaseService';
import { hashPin, verifyPin } from '../utils/pinUtils';

// Sync user data to backend database for Stripe account creation
const syncUserToBackend = async (userData: UserData): Promise<any> => {
  try {
    console.log('🔄 Syncing user to backend database:', userData.id);

    const response = await fetch('https://handypay-backend.onrender.com/api/users/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        authProvider: userData.authProvider,
        memberSince: userData.memberSince,
        appleUserId: userData.authProvider === 'apple' ? userData.id : null,
        googleUserId: userData.authProvider === 'google' ? userData.id : null,
        faceIdEnabled: userData.faceIdEnabled,
        safetyPinEnabled: userData.safetyPinEnabled,
      }),
    });

    if (!response.ok) {
      console.error('Backend sync failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Backend sync successful:', result);

    // Return the full result so frontend can check for existingAccount
    return result;
  } catch (error) {
    console.error('❌ Backend sync error:', error);
    return false;
  }
};

export interface UserData {
  id: string;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  authProvider: 'apple' | 'google';
  appleUserId: string | null;
  googleUserId: string | null;
  stripeAccountId: string | null;
  stripeOnboardingCompleted: boolean;
  memberSince: string;
  faceIdEnabled: boolean;
  safetyPinEnabled: boolean;
  avatarUri?: string;
}

interface UserContextType {
  user: UserData | null;
  setUser: (userData: UserData | null) => Promise<void>;
  clearUser: () => Promise<void>;
  updateLastLogin: () => Promise<void>;
  updateFaceIdEnabled: (enabled: boolean) => Promise<void>;
  updateSafetyPin: (pin: string) => Promise<void>;
  updateSafetyPinEnabled: (enabled: boolean) => Promise<void>;
  verifySafetyPin: (pin: string) => Promise<boolean>;
  updateAvatarUri: (avatarUri: string) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@handypay_user_data';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        setUserState(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: UserData | null) => {
    try {
      if (userData) {
        // Save to local storage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUserState(userData);
        console.log('User data saved locally:', userData);

        // Also save to Supabase database
        try {
          const dbResult = await SupabaseUserService.upsertUser(userData);
          if (dbResult) {
            console.log('User data synced to Supabase:', dbResult);
          } else {
            console.warn('Failed to sync user data to Supabase');
          }
        } catch (dbError) {
          console.warn('Supabase sync error (continuing with local storage):', dbError);
        }

        // Also sync to backend database for Stripe account creation
        try {
          const backendSyncResult = await syncUserToBackend(userData);

          // Handle case where provider is already linked to another account
          if (backendSyncResult && backendSyncResult.existingAccount && backendSyncResult.userId !== userData.id) {
            console.log('🔄 Provider already linked to different account, switching to:', backendSyncResult.userId);

            // Load the existing account data
            const existingUserData = await SupabaseUserService.getUser(backendSyncResult.userId);
            if (existingUserData) {
              // Save the existing account data instead
              await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(existingUserData));
              setUserState(existingUserData);
              console.log('✅ Switched to existing account:', existingUserData);
              return; // Don't proceed with original user data
            }
          }

          if (backendSyncResult) {
            console.log('User data synced to backend database:', backendSyncResult);
          } else {
            console.warn('Failed to sync user data to backend');
          }
        } catch (backendError) {
          console.warn('Backend sync error (continuing with Supabase sync):', backendError);
        }
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        setUserState(null);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUserState(null);
      console.log('User data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const updateLastLogin = async () => {
    if (user) {
      try {
        await SupabaseUserService.updateLastLogin(user.id);
        console.log('Last login updated in Supabase');
      } catch (error) {
        console.warn('Failed to update last login:', error);
      }
    }
  };

  const updateFaceIdEnabled = async (enabled: boolean) => {
    if (user) {
      try {
        // Update local state first
        const updatedUser = { ...user, faceIdEnabled: enabled };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUserState(updatedUser);

        // Update in Supabase
        await SupabaseUserService.updateFaceIdEnabled(user.id, enabled);
        console.log(`Face ID ${enabled ? 'enabled' : 'disabled'} and saved`);
      } catch (error) {
        console.error('Failed to update Face ID preference:', error);
      }
    }
  };

  const updateSafetyPin = async (pin: string) => {
    if (user) {
      try {
        // Hash the PIN before storing
        const hashedPin = await hashPin(pin);
        
        // Update local state first
        const updatedUser = { ...user, safetyPinEnabled: true };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUserState(updatedUser);

        // Update in Supabase
        await SupabaseUserService.updateSafetyPin(user.id, hashedPin, true);
        console.log('Safety PIN updated and saved');
      } catch (error) {
        console.error('Failed to update Safety PIN:', error);
        throw error;
      }
    }
  };

  const updateSafetyPinEnabled = async (enabled: boolean) => {
    if (user) {
      try {
        // Update local state first
        const updatedUser = { ...user, safetyPinEnabled: enabled };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUserState(updatedUser);

        // Update in Supabase
        await SupabaseUserService.updateSafetyPinEnabled(user.id, enabled);
        console.log(`Safety PIN ${enabled ? 'enabled' : 'disabled'} and saved`);
      } catch (error) {
        console.error('Failed to update Safety PIN preference:', error);
        throw error;
      }
    }
  };

  const verifySafetyPin = async (pin: string): Promise<boolean> => {
    if (user) {
      try {
        // Hash the input PIN
        const hashedPin = await hashPin(pin);
        
        // Verify against stored hash in Supabase
        const isValid = await SupabaseUserService.verifySafetyPin(user.id, hashedPin);
        console.log('Safety PIN verification:', isValid ? 'success' : 'failed');
        return isValid;
      } catch (error) {
        console.error('Failed to verify Safety PIN:', error);
        return false;
      }
    }
    return false;
  };

  const updateAvatarUri = async (avatarUri: string) => {
    if (user) {
      try {
        // Update local state first
        const updatedUser = { ...user, avatarUri };
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUserState(updatedUser);

        // Also save to Supabase database (for now just local storage)
        console.log('Avatar URI updated locally:', avatarUri);
      } catch (error) {
        console.error('Failed to update avatar URI:', error);
        throw error;
      }
    }
  };

  const value: UserContextType = {
    user,
    setUser,
    clearUser,
    updateLastLogin,
    updateFaceIdEnabled,
    updateSafetyPin,
    updateSafetyPinEnabled,
    verifySafetyPin,
    updateAvatarUri,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Helper function to decode Apple identity token (JWT)
const decodeAppleIdentityToken = (identityToken: string) => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = identityToken.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (middle part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.warn('Error decoding Apple identity token:', error);
    return null;
  }
};

// Helper function to create user data from Apple auth response
export const createUserFromAppleAuth = (appleCredential: any): UserData => {
  const now = new Date().toISOString();
  
  // Try to get email from the credential first, then from identity token
  let email = appleCredential.email;
  let firstName = appleCredential.fullName?.givenName;
  let lastName = appleCredential.fullName?.familyName;
  
  // If email is missing, try to extract it from the identity token
  if (!email && appleCredential.identityToken) {
    const tokenData = decodeAppleIdentityToken(appleCredential.identityToken);
    if (tokenData && tokenData.email) {
      email = tokenData.email;
      console.log('Extracted email from Apple identity token:', email);
    }
    
    // Some tokens might contain name information (rare but possible)
    if (tokenData && tokenData.name && !firstName && !lastName) {
      firstName = tokenData.given_name || tokenData.first_name;
      lastName = tokenData.family_name || tokenData.last_name;
      console.log('Extracted name from Apple identity token:', { firstName, lastName });
    }
  }
  
  const fullName = (firstName || lastName) ? 
    `${firstName || ''} ${lastName || ''}`.trim() : null;
  
  // Log what data we're working with for debugging
  console.log('Apple auth data processed:', { 
    id: appleCredential.user,
    email, 
    firstName, 
    lastName, 
    fullName,
    hasIdentityToken: !!appleCredential.identityToken 
  });
  
  return {
    id: appleCredential.user || 'apple_user_' + Date.now(),
    email: email || null,
    fullName: fullName,
    firstName: firstName || null,
    lastName: lastName || null,
    authProvider: 'apple',
    appleUserId: appleCredential.user || null,
    googleUserId: null,
    stripeAccountId: null, // Will be set when Stripe account is created
    stripeOnboardingCompleted: false, // Will be updated when onboarding completes
    memberSince: now,
    faceIdEnabled: false, // Default to false, user can enable in settings
    safetyPinEnabled: false, // Default to false, user can enable in settings
    avatarUri: undefined, // Default to no avatar
  };
};

export const createUserFromGoogleAuth = (googleCredential: any): UserData => {
  const now = new Date().toISOString();

  // Extract user information from Google OAuth response
  const user = googleCredential.user || {};
  const email = user.email || googleCredential.email;
  const firstName = user.given_name || user.firstName;
  const lastName = user.family_name || user.lastName;
  const fullName = user.name || user.fullName ||
    (firstName && lastName ? `${firstName} ${lastName}` : null);

  // Log what data we're working with for debugging
  console.log('Google auth data processed:', {
    id: user.id || user.sub,
    email,
    firstName,
    lastName,
    fullName,
    picture: user.picture
  });

  return {
    id: user.id || user.sub || 'google_user_' + Date.now(),
    email: email || null,
    fullName: fullName,
    firstName: firstName || null,
    lastName: lastName || null,
    authProvider: 'google',
    appleUserId: null,
    googleUserId: user.id || user.sub || null,
    stripeAccountId: null, // Will be set when Stripe account is created
    stripeOnboardingCompleted: false, // Will be updated when onboarding completes
    memberSince: now,
    faceIdEnabled: false, // Default to false, user can enable in settings
    safetyPinEnabled: false, // Default to false, user can enable in settings
    avatarUri: user.picture, // Google provides profile picture URL
  };
};

// Helper function to get user initials
export const getUserInitials = (user: UserData | null): string => {
  if (!user) return '??';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  
  if (user.fullName) {
    const names = user.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

// Helper function to get display name
export const getUserDisplayName = (user: UserData | null): string => {
  if (!user) return 'User';
  
  if (user.fullName) return user.fullName;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split('@')[0];
  
  return 'User';
};