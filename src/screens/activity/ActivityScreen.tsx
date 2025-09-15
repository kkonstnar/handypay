import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Avatar from '../../components/ui/Avatar';
import ActivityHeader from '../../components/activity/ActivityHeader';
import TransactionList from '../../components/activity/TransactionList';
import TransactionDetailsModal from '../../components/activity/TransactionDetailsModal';
import AccountModal from '../../components/modals/AccountModal';
import { useUser, getUserInitials, getUserDisplayName } from '../../contexts/UserContext';
import { BiometricAuthService } from '../../services';

import ReportBugModal from '../../components/modals/ReportBugModal';
import LanguageModal from '../../components/modals/LanguageModal';
import LegalModal from '../../components/modals/LegalModal';
import AuthenticationMethodModal from '../../components/modals/AuthenticationMethodModal';
import SafetyPinModal from '../../components/modals/SafetyPinModal';
import { useTransactions } from '../../contexts/TransactionContext';
import { apiService } from '../../services';
import { useApi } from '../../hooks/useApi';
import { Transaction } from '../../contexts/TransactionContext';
import { groupTransactionsByDate } from '../../utils/helpers';


interface TransactionSection {
  title: string;
  data: Transaction[];
}



function ActivityScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  const [showReportBugModal, setShowReportBugModal] = useState(false);

  // Check if this is the first visit to activity page
  useEffect(() => {
    const checkFirstVisit = async () => {
      try {
        const hasVisitedActivity = await AsyncStorage.getItem('@handypay_has_visited_activity');
        if (hasVisitedActivity === 'true') {
          setIsFirstVisit(false);
          setIsLoading(false); // Don't show loading on subsequent visits
        } else {
          // Mark as visited for future visits
          await AsyncStorage.setItem('@handypay_has_visited_activity', 'true');
        }
      } catch (error) {
        console.error('Error checking first visit:', error);
        setIsFirstVisit(false);
        setIsLoading(false);
      }
    };

    checkFirstVisit();
  }, []);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showAuthenticationMethodModal, setShowAuthenticationMethodModal] = useState(false);
  const [currentAuthMethod, setCurrentAuthMethod] = useState<'apple' | 'google'>('apple');
  const [showSafetyPinModal, setShowSafetyPinModal] = useState(false);

  const { transactions, cancelTransaction } = useTransactions();
  const { user, clearUser } = useUser();
  const userData = user; // Explicit typing to help TypeScript

  // Memoize user data to prevent unnecessary re-renders
  const userInitials = useMemo(() => getUserInitials(user), [user]);
  const userAvatarUri = useMemo(() => userData?.avatarUri, [userData?.avatarUri]);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showSafetyPinVerifyModal, setShowSafetyPinVerifyModal] = useState(false);
  const [transactionUpdateKey, setTransactionUpdateKey] = useState(0);
  const [lastTransactionCount, setLastTransactionCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Monitor transaction changes and force re-render
  React.useEffect(() => {
    if (transactions.length !== lastTransactionCount) {
      setLastTransactionCount(transactions.length);
      setTransactionUpdateKey(prev => prev + 1);
    }
  }, [transactions.length, lastTransactionCount]);

  // API hooks for remote data
  const {
    data: apiTransactions,
    loading: apiLoading,
    error: apiError,
    refetch: refetchTransactions
  } = useApi<Transaction[] | { transactions: Transaction[] }>(() => {
    // Only fetch if we have authenticated user data
    if (userData?.id) {
      console.log('📡 Fetching transactions for user:', userData.id);
      return apiService.getUserTransactions(userData.id);
    } else {
      console.log('⚠️ No authenticated user data available for transaction fetch');
      // Return a promise that resolves to empty data
      return Promise.resolve({ data: [], success: true });
    }
  });

  // Search API functionality
  const performAPISearch = React.useCallback(async (query: string) => {
    if (query.trim().length > 2) {
      try {
        const response = await apiService.searchTransactions(query);
        if (response.success && response.data) {
          // Handle search results - could show in a separate state
          console.log('Search results:', response.data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    }
  }, []);

  // Refetch transactions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id) {
        console.log('🔄 Activity screen focused, refetching transactions...');
        refetchTransactions();
      }
    }, [userData?.id, refetchTransactions])
  );

  const handleAvatarPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAccountModal(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTransactions]);

  const closeAccountModal = () => {
    setShowAccountModal(false);
  };

  const handleShowSafetyPin = () => {
    setShowSafetyPinModal(true);
  };

  // Authentication handler similar to HomeScreen
  const authenticateUser = async (action: () => void, message: string) => {
    if (userData?.faceIdEnabled) {
      // Use Face ID authentication
      const authSuccess = await BiometricAuthService.authenticateWithPrompt(
        message,
        {
          showErrorAlert: true,
          allowRetry: true,
          onSuccess: action
        }
      );

      // If authentication failed or was cancelled, don't proceed with the action
      if (!authSuccess) {
        console.log('❌ Face ID authentication failed or cancelled, aborting action');
        return;
      }
    } else if (userData?.safetyPinEnabled) {
      // Use Safety PIN authentication
      setPendingAction(() => action);
      setShowSafetyPinVerifyModal(true);
      // Don't return here - the PIN modal will handle the action when verified
    } else {
      // No authentication required, proceed directly
      action();
    }
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

  // Show skeleton loading only on first visit
  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  // Update transactions when tab is focused (no loading for subsequent visits)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only show brief loading on first visit
      if (isFirstVisit) {
        setIsLoading(true);
      }

      refetchTransactions(); // Fetch fresh data from API
      setTransactionUpdateKey(prev => prev + 1); // Force re-render to show new transactions

      // Hide loading after short delay (only if first visit)
      if (isFirstVisit) {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    });
    return unsubscribe;
  }, [navigation, refetchTransactions, isFirstVisit]);


  // Combine context data and API transactions (no mock data)
  const allTransactions = React.useMemo(() => {
    // Handle API response structure - it could be an array or an object with transactions property
    let apiTxns: Transaction[] = [];
    if (apiTransactions) {
      if (Array.isArray(apiTransactions)) {
        apiTxns = apiTransactions;
      } else if (apiTransactions.transactions && Array.isArray(apiTransactions.transactions)) {
        apiTxns = apiTransactions.transactions;
      }
    }

    const processedApiTxns = apiTxns.map((tx: Transaction, index: number) => {
      let dateObj = new Date(); // Default to current date
      if (tx.date) {
        const parsedDate = new Date(tx.date);
        if (!isNaN(parsedDate.getTime())) {
          dateObj = parsedDate;
        }
      }

      return {
        ...tx,
        originalId: tx.id, // Store original ID for cancellation
        id: `api_${tx.id}_${index}`, // Ensure unique IDs for UI
        date: dateObj // Convert string date to Date object
      };
    });

    const contextTxns = transactions.map((tx: Transaction, index: number) => ({
      ...tx,
      originalId: tx.id, // Store original ID for cancellation
      id: `ctx_${tx.id}_${index}` // Ensure unique IDs for UI
    }));

    // Use only real data from context and API
    const combined: Transaction[] = [...contextTxns, ...processedApiTxns];

    console.log('📊 Combined transactions:', combined.map(tx => ({
      uiId: tx.id,
      originalId: tx.originalId,
      type: tx.type,
      status: tx.status,
      source: tx.id.startsWith('ctx_') ? 'context' : 'api'
    })));

    return combined;
  }, [transactions, apiTransactions, transactionUpdateKey]);

  // Auto-refresh transactions every 10 minutes for pending transactions only (reduced frequency)
  useEffect(() => {
    // Only auto-refresh if there are actually pending transactions
    const hasPendingTransactions = allTransactions.some(tx => tx.status === 'pending');
    
    if (!hasPendingTransactions || !userData?.id || isFirstVisit) {
      return; // Don't set up polling if no pending transactions
    }

    console.log('🔄 Setting up auto-refresh for pending transactions...');
    const pollInterval = setInterval(() => {
      // Double-check that we still have pending transactions before refreshing
      const stillHasPending = allTransactions.some(tx => tx.status === 'pending');
      if (stillHasPending && userData?.id && !isFirstVisit) {
        console.log('🔄 Auto-refreshing transactions (pending transactions detected)...');
        refetchTransactions();
      }
    }, 600000); // Increased to 10 minutes to reduce server load

    return () => {
      console.log('🔄 Clearing auto-refresh interval');
      clearInterval(pollInterval);
    };
  }, [userData?.id, refetchTransactions, isFirstVisit, allTransactions.length]); // Use length instead of full array

  // Show error message if API call fails
  React.useEffect(() => {
    if (apiError && !isLoading) {
      const isTimeoutError = apiError.includes('timeout') || apiError.includes('408');
      
      if (isTimeoutError) {
        console.log('⚠️ Timeout error detected, showing user-friendly message');
        // Don't show alert for timeout errors - they're handled gracefully
        // Just log and continue showing cached data
      } else {
        Alert.alert('Connection Error', 'Unable to fetch latest transactions. Showing cached data.');
      }
    }
  }, [apiError, isLoading]);
  
  const filteredTransactions = allTransactions.filter(transaction => {
    // Filter by search query
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch = 
        transaction.description.toLowerCase().includes(query) ||
        (transaction.merchant && transaction.merchant.toLowerCase().includes(query)) ||
        transaction.amount.toString().includes(query) ||
        (transaction.cardLast4 && transaction.cardLast4.includes(query)) ||
        transaction.date.toLocaleDateString().toLowerCase().includes(query) ||
        transaction.date.toDateString().toLowerCase().includes(query);
    }
    
    return searchMatch;
  });
  
  const sections = groupTransactionsByDate(filteredTransactions);
  
  const handleTransactionPress = (transaction: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('📱 Transaction pressed:', {
      uiId: transaction.id,
      originalId: transaction.originalId,
      type: transaction.type,
      status: transaction.status,
      stripePaymentLinkId: transaction.stripePaymentLinkId,
      isPaymentLink: transaction.type === 'payment_link'
    });
    setSelectedTransaction(transaction);
  };
  
  const closeTransactionDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTransaction(null);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <ActivityHeader 
        onAvatarPress={handleAvatarPress}
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchToggle={useCallback(() => setShowSearch(!showSearch), [showSearch])}
        onSearchChange={useCallback(setSearchQuery, [])}
        userInitials={userInitials}
        userAvatarUri={userAvatarUri}
      />

      
      <TransactionList 
        sections={sections}
        onTransactionPress={handleTransactionPress}
        isLoading={isLoading}
        isFirstVisit={isFirstVisit}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      
      
      <TransactionDetailsModal 
        transaction={selectedTransaction}
        visible={!!selectedTransaction}
        onClose={closeTransactionDetails}
        onCancelTransaction={async (transactionId) => {
          try {
            // Find the transaction to get its original ID
            const transaction = allTransactions.find(tx => tx.id === transactionId);

            console.log('🎯 Transaction to cancel:', {
              uiId: transactionId,
              originalId: transaction?.originalId,
              type: transaction?.type,
              status: transaction?.status,
              stripePaymentLinkId: transaction?.stripePaymentLinkId,
              fullTransaction: transaction
            });

            // Use originalId if available, otherwise use the transactionId
            const idToCancel = transaction?.originalId || transactionId;

            console.log('🗑️ Cancelling transaction with UI ID:', transactionId, 'ID to send:', idToCancel);
            await cancelTransaction(idToCancel, userData?.id || '');

            // Show success message
            Toast.show({
              type: 'success',
              text1: 'Transaction cancelled',
              text2: 'The payment link has been deactivated',
            });

            // Refresh transaction data to show updated status
            setTransactionUpdateKey(prev => prev + 1);
            refetchTransactions();

            closeTransactionDetails();
          } catch (error) {
            console.error('Failed to cancel transaction:', error);

            // Show error message
            Alert.alert(
              'Cancellation Failed',
              error instanceof Error ? error.message : 'Failed to cancel transaction. Please try again.'
            );
          }
        }}
      />

      {/* Account Modal */}
      <AccountModal
        visible={showAccountModal}
        onClose={closeAccountModal}
        userName={getUserDisplayName(user)}
        userInitials={getUserInitials(user)}
        memberSince={userData?.memberSince ? (() => {
          const date = new Date(userData.memberSince);
          return !isNaN(date.getTime()) ? date.toLocaleDateString() : undefined;
        })() : undefined}
        currentAuthMethod={userData?.authProvider || 'apple'}
        onShowReportBug={() => setShowReportBugModal(true)}
        onShowLanguage={() => setShowLanguageModal(true)}
        onShowLegal={() => setShowLegalModal(true)}
        onShowAuthenticationMethod={() => setShowAuthenticationMethodModal(true)}
        onShowSafetyPin={handleShowSafetyPin}
        userAvatar={userData?.avatarUri}
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

      <AuthenticationMethodModal
        visible={showAuthenticationMethodModal}
        onClose={() => setShowAuthenticationMethodModal(false)}
        currentMethod={currentAuthMethod}
        onShowSafetyPin={handleShowSafetyPin}
        onMethodChange={setCurrentAuthMethod}
        onLogoutWithAuth={handleLogoutWithAuth}
      />

      <SafetyPinModal
        visible={showSafetyPinModal}
        onClose={() => setShowSafetyPinModal(false)}
        onPinSet={(pin) => {
          console.log('PIN set:', pin);
          Alert.alert('PIN Set', 'Your safety PIN has been successfully set up!');
          setShowSafetyPinModal(false);
        }}
      />

      <SafetyPinModal
        visible={showSafetyPinVerifyModal}
        onClose={() => {
          setShowSafetyPinVerifyModal(false);
          setPendingAction(null);
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
    </View>
  );
}

export default memo(ActivityScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -1,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  searchBarContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12
  },
  searchIcon: {
    flexShrink: 0
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'DMSans-Medium'
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#9ca3af',
    fontFamily: 'DMSans-Medium'
  },
  transactionsList: {
    flex: 1
  },
  transactionsContent: {
    paddingBottom: 32
  }
});