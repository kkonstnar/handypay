import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseUserService } from '../services/SupabaseService';
import { hashPin, verifyPin } from '../utils/pinUtils';
import { authClient, apiService } from '../services';

// Sync user data to backend database for Stripe account creation
const syncUserToBackend = async (userData: UserData): Promise<any> => {
  try {
    // Only log in development mode to reduce console spam
    if (__DEV__) {
      console.log('🔄 Syncing user to backend database:', userData.id);
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://handypay-backend.handypay.workers.dev/api/users/sync', {
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Only log errors in development mode
      if (__DEV__) {
        console.error('Backend sync failed:', response.status, response.statusText);
      }
      return false;
    }

    const result = await response.json();
    // Only log success in development mode
    if (__DEV__) {
      console.log('✅ Backend sync successful');
    }

    // Return the full result so frontend can check for existingAccount
    return result;
  } catch (error) {
    // Only log errors in development mode
    if (__DEV__) {
      console.error('❌ Backend sync error:', error instanceof Error ? error.message : 'Unknown error');
    }
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

  // Ban status (for real-time ban detection)
  isBanned?: boolean;
  banReason?: string;
  banType?: string;
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
  // Avatar caching methods
  cachedAvatarUri: string | null;
  cacheAvatar: (uri: string) => Promise<void>;
  getCachedAvatar: () => string | null;
  avatarLoading: boolean;
  // Ban status checking
  checkBanStatus: () => Promise<void>;
  isBanned: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@handypay_user_data';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedAvatarUri, setCachedAvatarUri] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Load user data on app start
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('🔍 Checking for authenticated session...');

        // Check for Better Auth session first
        const session = await authClient.getSession();
        console.log('📋 Session check result:', {
          hasSession: !!session,
          hasData: !!session?.data,
          hasUser: !!session?.data?.user,
          sessionKeys: session ? Object.keys(session) : [],
          dataKeys: session?.data ? Object.keys(session.data) : [],
          userKeys: session?.data?.user ? Object.keys(session.data.user) : []
        });

        if (session.data?.user) {
          console.log('✅ Found authenticated session:', session.data.user.id);

          // Create initial user data from authenticated session
          let userData: UserData = {
            id: session.data.user.id,
            email: session.data.user.email || null,
            fullName: session.data.user.name || null,
            firstName: session.data.user.name?.split(' ')[0] || null,
            lastName: session.data.user.name?.split(' ').slice(1).join(' ') || null,
            authProvider: session.data.user.image ? 'google' : 'apple',
            appleUserId: session.data.user.appleUserId || null,
            googleUserId: session.data.user.googleUserId || null,
            stripeAccountId: session.data.user.stripeAccountId || null,
            stripeOnboardingCompleted: session.data.user.stripeOnboardingCompleted || false,
            memberSince: session.data.user.createdAt || new Date().toISOString(),
            faceIdEnabled: session.data.user.faceIdEnabled || false,
            safetyPinEnabled: session.data.user.safetyPinEnabled || false,
            avatarUri: session.data.user.image || undefined,
          };

          // Fetch latest onboarding status from backend
          try {
            console.log('🔄 Fetching latest onboarding status from backend...');
            const response = await fetch(
              `https://handypay-backend.handypay.workers.dev/api/stripe/user-account/${userData.id}`
            );

            if (response.ok) {
              const backendData = await response.json();
              console.log('✅ Backend data received:', backendData);

              // Update user data with latest backend information
              userData = {
                ...userData,
                stripeAccountId: backendData.stripe_account_id || userData.stripeAccountId,
                stripeOnboardingCompleted: backendData.stripe_onboarding_completed || false,
              };
              console.log('🔄 Updated user data with backend info');
            } else {
              console.warn('⚠️ Could not fetch backend data, using session data');
            }
          } catch (error) {
            console.warn('⚠️ Error fetching backend data:', error);
          }

          // Store in AsyncStorage for offline access
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
          setUserState(userData);
          console.log('✅ User authenticated and loaded from session');
        } else {
          // No authenticated session, try to load from AsyncStorage for offline mode
          console.log('⚠️ No authenticated session found, checking local storage...');
          const storedUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);

          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData);
              console.log('👤 Loaded user data from AsyncStorage:', {
                id: userData.id,
                email: userData.email,
                fullName: userData.fullName,
                authProvider: userData.authProvider,
                hasAvatar: !!userData.avatarUri
              });
              setUserState(userData);
              console.log('✅ User data loaded from AsyncStorage');
            } catch (parseError) {
              console.error('❌ Error parsing stored user data:', parseError);
              setUserState(null);
              // Clear corrupted data
              await AsyncStorage.removeItem(USER_STORAGE_KEY);
            }
          } else {
            console.log('ℹ️ No user data found in storage');
            setUserState(null);
          }
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);

        // Fallback: try to load from AsyncStorage
        try {
          const storedUserData = await AsyncStorage.getItem(USER_STORAGE_KEY);
          if (storedUserData) {
            const userData = JSON.parse(storedUserData);
            setUserState(userData);
            console.log('✅ Fallback: loaded user data from AsyncStorage');
          } else {
            setUserState(null);
          }
        } catch (storageError) {
          console.error('❌ Fallback: error loading from AsyncStorage:', storageError);
          setUserState(null);
        }
      } finally {
        // Schedule the loading state update to avoid render-time state updates
        setTimeout(() => {
          setIsLoading(false);
        }, 0);
      }
    };

    initializeUser();
  }, []);

  // Ban status monitoring - smart approach
  const checkBanStatus = async (showToast: boolean = true) => {
    if (!user?.id) return;

    try {
      console.log('🔍 Checking ban status for user:', user.id);
      const response = await fetch(`https://handypay-backend.handypay.workers.dev/api/users/ban-status/${user.id}`);

      if (response.ok) {
        const banData = await response.json();

        if (banData.isBanned && !user.isBanned) {
          console.log('🚫 User is banned, updating state');

          const updatedUser = {
            ...user,
            isBanned: true,
            banReason: banData.banReason,
            banType: banData.banType,
          };

          setUserState(updatedUser);
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

          // Show the ban notification toast (if requested)
          if (showToast) {
            const { showBanNotification } = await import('../utils/banNotification');
            showBanNotification({
              reason: banData.banReason,
              type: banData.banType
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking ban status:', error);
    }
  };

  // Only check ban status on:
  // 1. App startup (when user data is loaded)
  // 2. When user logs in
  // 3. When app comes back from background (optional)
  useEffect(() => {
    if (user?.id && !user.isBanned) {
      // Check immediately when user data is available
      checkBanStatus(true);
    }
  }, [user?.id]);

  const setUser = async (userData: UserData | null) => {
    try {
      console.log('🔄 setUser called with:', userData ? {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        authProvider: userData.authProvider,
        hasAvatar: !!userData.avatarUri
      } : 'null');

      if (userData) {
        // Save to local storage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUserState(userData);
        console.log('✅ User data saved locally:', userData.id);

        // Also save to Supabase database
        try {
          const dbResult = await SupabaseUserService.upsertUser(userData as any);
          if (dbResult) {
            console.log('✅ User data synced to Supabase:', dbResult);
          } else {
            console.warn('⚠️ Failed to sync user data to Supabase');
          }
        } catch (dbError) {
          console.warn('⚠️ Supabase sync error (continuing with local storage):', dbError);
        }

        // Also sync to backend database for Stripe account creation
        try {
          const backendSyncResult = await syncUserToBackend(userData);
          console.log('🔄 Backend sync result:', backendSyncResult);

          // Handle case where provider is already linked to another account
          if (backendSyncResult && backendSyncResult.existingAccount && backendSyncResult.userId !== userData.id) {
            console.log('🔄 Provider already linked to different account, switching to:', backendSyncResult.userId);

            // Load the existing account data
            const existingUserData = await SupabaseUserService.getUser(backendSyncResult.userId);
            if (existingUserData) {
              // Transform DatabaseUser to UserData format
              const transformedUserData: UserData = {
                id: existingUserData.id,
                email: existingUserData.email || null,
                fullName: existingUserData.full_name || null,
                firstName: existingUserData.first_name || null,
                lastName: existingUserData.last_name || null,
                authProvider: (existingUserData as any).auth_provider || 'apple',
                appleUserId: (existingUserData as any).apple_user_id || null,
                googleUserId: (existingUserData as any).google_user_id || null,
                stripeAccountId: (existingUserData as any).stripe_account_id || null,
                stripeOnboardingCompleted: (existingUserData as any).stripe_onboarding_completed || false,
                memberSince: existingUserData.created_at || new Date().toISOString(),
                faceIdEnabled: (existingUserData as any).face_id_enabled || false,
                safetyPinEnabled: (existingUserData as any).safety_pin_enabled || false,
                avatarUri: (existingUserData as any).avatar_uri || undefined,
                isBanned: (existingUserData as any).is_banned || false,
                banReason: (existingUserData as any).ban_reason || undefined,
                banType: (existingUserData as any).ban_type || undefined,
              };

              // Save the transformed data
              await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(transformedUserData));
              setUserState(transformedUserData);
              console.log('✅ Switched to existing account:', transformedUserData);
              return; // Don't proceed with original user data
            }
          }

          if (backendSyncResult) {
            console.log('✅ User data synced to backend database');
          } else {
            console.warn('⚠️ Failed to sync user data to backend');
          }
        } catch (backendError) {
          console.warn('⚠️ Backend sync error (continuing with Supabase sync):', backendError);
        }

        console.log('🎉 setUser completed successfully for user:', userData.id);
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        setUserState(null);
        console.log('🗑️ User data cleared');
      }
    } catch (error) {
      console.error('❌ Error saving user data:', error);
      throw error; // Re-throw so caller knows it failed
    }
  };

  const clearUser = async () => {
    try {
      // Sign out from Better Auth first - this will clear the server session
      try {
        await authClient.signOut();
        console.log('✅ Signed out from Better Auth server session');
      } catch (authError) {
        console.warn('⚠️ Failed to sign out from Better Auth:', authError);
      }

      // Clear local storage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem('@handypay_cached_avatar'); // Clear cached avatar
      setUserState(null);
      setCachedAvatarUri(null); // Clear cached avatar state
      console.log('✅ User data and cached avatar cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
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

  // Avatar caching methods
  const cacheAvatar = async (uri: string) => {
    try {
      setAvatarLoading(true);
      setCachedAvatarUri(uri);
      // Cache in AsyncStorage for persistence across app restarts
      await AsyncStorage.setItem('@handypay_cached_avatar', uri);
      if (__DEV__) {
        console.log('✅ Avatar cached globally:', uri);
      }
    } catch (error) {
      console.error('❌ Failed to cache avatar:', error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const getCachedAvatar = () => {
    return cachedAvatarUri;
  };

  // Load cached avatar on startup
  useEffect(() => {
    const loadCachedAvatar = async () => {
      try {
        const cachedUri = await AsyncStorage.getItem('@handypay_cached_avatar');
        if (cachedUri) {
          setCachedAvatarUri(cachedUri);
          if (__DEV__) {
            console.log('✅ Cached avatar loaded:', cachedUri);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load cached avatar:', error);
      }
    };

    loadCachedAvatar();
  }, []);

  // Auto-cache avatar when user data changes
  useEffect(() => {
    if (user?.avatarUri && !cachedAvatarUri) {
      cacheAvatar(user.avatarUri);
    }
  }, [user?.avatarUri]);

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
    // Avatar caching
    cachedAvatarUri,
    cacheAvatar,
    getCachedAvatar,
    avatarLoading,
    // Ban status
    checkBanStatus,
    isBanned: user?.isBanned || false,
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