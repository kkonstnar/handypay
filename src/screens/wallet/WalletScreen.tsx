import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Avatar from '../../components/ui/Avatar';
import AccountModal from '../../components/modals/AccountModal';
import SafetyPinModal from '../../components/modals/SafetyPinModal';
import { useUser, getUserInitials, getUserDisplayName } from '../../contexts/UserContext';

import ReportBugModal from '../../components/modals/ReportBugModal';
import LanguageModal from '../../components/modals/LanguageModal';
import LegalModal from '../../components/modals/LegalModal';
import AuthenticationMethodModal from '../../components/modals/AuthenticationMethodModal';
import { apiService } from '../../services';
import { useApi } from '../../hooks/useApi';
import { PayoutHistoryItem, Payout, Balance } from '../../types';
import { formatDate } from '../../utils/helpers';

import Toast from 'react-native-toast-message';

export default function WalletScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user, updateSafetyPin } = useUser();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<PayoutHistoryItem | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [showReportBugModal, setShowReportBugModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showAuthenticationMethodModal, setShowAuthenticationMethodModal] = useState(false);
  const [currentAuthMethod, setCurrentAuthMethod] = useState<'apple' | 'google'>(user?.authProvider || 'apple');
  const [createPayoutLoading, setCreatePayoutLoading] = useState(false);
  const [showSafetyPinModal, setShowSafetyPinModal] = useState(false);



  // API hooks for payout data
  const {
    data: apiPayouts,
    loading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts
  } = useApi<Payout[]>(() => apiService.getPayouts(user?.id));

  const {
    data: balance,
    loading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance
  } = useApi<Balance>(() => apiService.getBalance(user?.id));

  // Next payout information
  const {
    data: nextPayout,
    loading: nextPayoutLoading,
    error: nextPayoutError,
    refetch: refetchNextPayout
  } = useApi<{
    date: string;
    amount: number;
    currency: string;
    bankAccountEnding: string;
    estimatedProcessingDays: number;
    stripeSchedule?: string;
  } | null>(() => apiService.getNextPayout(user?.id));

  // Use real payout data from API
  const allPayouts = React.useMemo(() => {
    if (!apiPayouts || !Array.isArray(apiPayouts)) {
      return [];
    }

    // Transform API payouts to match frontend interface
    return apiPayouts.map((payout) => ({
      id: payout.id,
      accountEnding: payout.bankAccount ? payout.bankAccount.slice(-4) : "****",
      date: payout.payoutDate ? new Date(payout.payoutDate).toISOString().split('T')[0] : (payout.createdAt ? new Date(payout.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      amount: payout.amount,
      type: 'bank' as const
    }));
  }, [apiPayouts]);

  // Handle creating a new payout
  const handleCreatePayout = async (amount: number, bankAccountId: string) => {
    try {
      setCreatePayoutLoading(true);
      const response = await apiService.createPayout(amount, bankAccountId);
      
      if (response.success) {
        Alert.alert('Success', 'Payout request submitted successfully');
        refetchPayouts();
        refetchBalance();
      } else {
        Alert.alert('Error', response.error || 'Failed to create payout');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create payout. Please try again.');
    } finally {
      setCreatePayoutLoading(false);
    }
  };

  // Error handling for API calls
  React.useEffect(() => {
    if (payoutsError) {
      console.error('Payouts API error:', payoutsError);
    }
    if (balanceError) {
      console.error('Balance API error:', balanceError);
    }
    if (nextPayoutError) {
      console.error('Next payout API error:', nextPayoutError);
    }
  }, [payoutsError, balanceError, nextPayoutError]);

  const handlePayoutItemPress = (item: PayoutHistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPayout(item);
  };

  const handleAccountPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAccountModal(true);
  };

  const closeAccountModal = () => {
    setShowAccountModal(false);
  };

  const handleShowSafetyPin = () => {
    console.log('handleShowSafetyPin called in WalletScreen');
    setShowSafetyPinModal(true);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payouts</Text>
        <Avatar onPress={handleAccountPress} imageUri={user?.avatarUri} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payable Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Payable balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {balanceLoading ? (
                'Loading...'
              ) : balanceError ? (
                'Setup required'
              ) : isBalanceVisible ? (
                `$${balance?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`
              ) : (
                '••••••••'
              )}
            </Text>
            <Text style={styles.balanceCurrency}>
              {balanceLoading ? '' : balance?.currency?.toLowerCase() || 'jmd'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              // Multiple exaggerated haptic feedback for balance toggle
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 50);
              setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
              setIsBalanceVisible(!isBalanceVisible);
            }}
            style={styles.balanceToggle}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isBalanceVisible ? "eye-off" : "eye"} 
              size={20} 
              color="#9ca3af" 
            />
          </TouchableOpacity>
        </View>

        {/* Next Payout Info */}
        <View style={styles.nextPayoutCard}>
          <View style={styles.nextPayoutRow}>
            <Text style={styles.nextPayoutLabel}>Next payout:</Text>
            <Text style={styles.nextPayoutDate}>
              {nextPayoutLoading ? 'Calculating...' : nextPayoutError ? 'Setup required' : nextPayout ? formatDate(nextPayout.date) : 'Not scheduled'}
            </Text>
          </View>

          <View style={styles.nextPayoutRow}>
            <Text style={styles.nextPayoutLabel}>Amount:</Text>
            <Text style={styles.nextPayoutAmount}>
              {isBalanceVisible
                ? nextPayoutError ? 'Setup required' : nextPayout ? `$${nextPayout.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}` : '$0.00'
                : '••••••••'
              }
            </Text>
          </View>

          <View style={styles.nextPayoutRow}>
            <Text style={styles.nextPayoutLabel}>To:</Text>
            <Text style={styles.nextPayoutAccount}>
              {nextPayoutError ? 'Setup required' : nextPayout ? `Bank account **** ${nextPayout.bankAccountEnding || '8689'}` : 'No account linked'}
            </Text>
          </View>

          <Text style={styles.payoutDescription}>
            {nextPayoutError
              ? 'Complete your Stripe setup to start receiving automatic payouts.'
              : nextPayout
                ? `Payouts are automatically processed by Stripe. ${nextPayout.stripeSchedule && `Schedule: ${nextPayout.stripeSchedule}. `}Processing typically takes ${nextPayout.estimatedProcessingDays || 2} business day${nextPayout.estimatedProcessingDays === 1 ? '' : 's'}.`
                : 'Set up your bank account to start receiving automatic payouts.'
            }
          </Text>
        </View>

        {/* Payout History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Payout history</Text>

          {payoutsLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Loading payout history...</Text>
            </View>
          ) : payoutsError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Complete setup to view payout history</Text>
            </View>
          ) : allPayouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No payouts yet</Text>
              <Text style={styles.emptyStateSubtext}>Your payout history will appear here</Text>
            </View>
          ) : (
            allPayouts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => handlePayoutItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.historyItemLeft}>
                  <View style={styles.historyIcon}>
                    <Svg width={20} height={20 * 20/21} viewBox="0 0 21 20" fill="none">
                      <Path d="M14.5469 8.62988H18.2198V15.116H14.5469V8.62988Z" fill="#3AB75C"/>
                      <Path d="M8.29492 8.62988H11.9678V15.116H8.29492V8.62988Z" fill="#3AB75C"/>
                      <Path d="M18.9211 16.2881C18.3311 16.2881 2.05231 16.2881 1.33821 16.2881C0.691862 16.2881 0.166016 16.8139 0.166016 17.4603V18.8278C0.166016 19.4742 0.691862 20 1.33821 20H18.9211C19.5675 20 20.0933 19.4742 20.0933 18.8278V17.4603C20.0933 16.8139 19.5675 16.2881 18.9211 16.2881Z" fill="#3AB75C"/>
                      <Path d="M19.3588 3.67988C10.33 -0.0118684 10.5716 0.0868696 10.5651 0.0842517C10.2865 -0.0272241 9.97674 -0.0294903 9.69018 0.0858927L0.900591 3.67988C0.454258 3.85946 0.166016 4.28606 0.166016 4.76733V6.28512C0.166016 6.93147 0.691862 7.45732 1.33821 7.45732H18.9211C19.5675 7.45732 20.0933 6.93147 20.0933 6.28512V4.76733C20.0933 4.28606 19.8051 3.85946 19.3588 3.67988ZM10.7158 4.3705C10.7158 4.69418 10.4534 4.9566 10.1297 4.9566C9.80599 4.9566 9.54357 4.69418 9.54357 4.3705V3.12016C9.54357 2.79648 9.80599 2.53406 10.1297 2.53406C10.4534 2.53406 10.7158 2.79648 10.7158 3.12016V4.3705Z" fill="#3AB75C"/>
                      <Path d="M2.04297 8.62988H5.71585V15.116H2.04297V8.62988Z" fill="#3AB75C"/>
                    </Svg>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyAccount}>Ending **** {item.accountEnding}</Text>
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                  </View>
                </View>

                <View style={styles.historyItemRight}>
                  <Text style={styles.historyAmount}>
                    {isBalanceVisible
                      ? `$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '••••••••'
                    }
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Payout Detail Modal */}
      {selectedPayout && (
        <Modal
          visible={!!selectedPayout}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.detailsContainer}>
            <View style={styles.detailsHeader}>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPayout(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.detailsTitle}>Payout Details</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Add share functionality here
                  Alert.alert('Share', 'Share functionality coming soon!');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="share" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={styles.detailsAmountSection}>
                <Text style={[styles.detailsAmount, { color: '#3AB75C' }]}>
                  ${selectedPayout.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.detailsDescription}>Payout to Bank Account</Text>
                <Text style={styles.detailsMerchant}>Ending **** {selectedPayout.accountEnding}</Text>
              </View>
              
              {/* Status */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Status</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.statusText, { color: '#3AB75C' }]}>
                      Completed
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Payout Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Payout Information</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Date</Text>
                  <Text style={styles.detailsValue}>
                    {formatDate(selectedPayout.date)}
                  </Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Type</Text>
                  <Text style={styles.detailsValue}>Bank Transfer</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Account</Text>
                  <Text style={styles.detailsValue}>Bank account **** {selectedPayout.accountEnding}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Processing Time</Text>
                  <Text style={styles.detailsValue}>1-2 business days</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Transaction ID</Text>
                  <Text style={styles.detailsValueMono}>PO-{selectedPayout.id}_{selectedPayout.accountEnding}</Text>
                </View>
              </View>
              
              {/* Actions */}
              <View style={styles.detailsActions}>
                <TouchableOpacity
                  style={styles.detailsActionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Download', 'Download functionality coming soon!');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download" size={20} color="#007AFF" />
                  <Text style={styles.detailsActionText}>Download Statement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsActionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Support', 'Contact support functionality coming soon!');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle" size={20} color="#007AFF" />
                  <Text style={styles.detailsActionText}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

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
        onShowSafetyPin={handleShowSafetyPin}
        onShowAuthenticationMethod={() => setShowAuthenticationMethodModal(true)}
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
      />

      <SafetyPinModal
        visible={showSafetyPinModal}
        onClose={() => setShowSafetyPinModal(false)}
        onPinSet={async (pin) => {
          console.log('PIN set:', pin);
          try {
            await updateSafetyPin(pin);
            Toast.show({
              type: 'success',
              text1: 'Safety PIN enabled successfully!',
            });
            setShowSafetyPinModal(false);
          } catch (error) {
            console.error('Failed to save PIN:', error);
            Alert.alert('Error', 'Failed to save your safety PIN. Please try again.');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'DMSans-SemiBold',
    letterSpacing: -1
  },
  content: {
    flex: 1,
    paddingHorizontal: 24
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 20,
    marginBottom: 16,
    position: 'relative'
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
    letterSpacing: -1,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  balanceCurrency: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500'
  },
  balanceToggle: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4
  },
  nextPayoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 20,
    marginBottom: 24
  },
  nextPayoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  nextPayoutLabel: {
    fontSize: 16,
    color: '#6b7280',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  nextPayoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  nextPayoutAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  nextPayoutAccount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  payoutDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 8,
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  historySection: {
    marginBottom: 32
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  historyInfo: {
    flex: 1
  },
  historyAccount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  historyDate: {
    fontSize: 13,
    color: '#6b7280',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3AB75C',
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  // Transaction Details Modal Styles (reused from ActivityScreen)
  detailsContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  detailsContent: {
    flex: 1
  },
  detailsAmountSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  detailsAmount: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
    fontFamily: 'SF-Pro-Rounded-Regular'
  },
  detailsDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center'
  },
  detailsMerchant: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center'
  },
  detailsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  detailsLabel: {
    fontSize: 16,
    color: '#6b7280'
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16
  },
  detailsValueMono: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'monospace',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  detailsActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16
  },
  detailsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 12
  },
  detailsActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500'
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'DMSans-Medium',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'DMSans-Medium',
  },
});