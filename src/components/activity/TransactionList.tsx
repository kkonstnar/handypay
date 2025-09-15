import React from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TransactionItem from './TransactionItem';
import { Transaction } from '../../contexts/TransactionContext';

interface TransactionSection {
  title: string;
  data: Transaction[];
}

interface TransactionListProps {
  sections: TransactionSection[];
  onTransactionPress: (transaction: Transaction) => void;
  isLoading?: boolean;
  isFirstVisit?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const SkeletonTransaction = () => (
  <View style={styles.skeletonItem}>
    <View style={styles.skeletonCardIcon} />
    <View style={styles.skeletonDetails}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonTime} />
    </View>
    <View style={styles.skeletonAmountSection}>
      <View style={styles.skeletonAmount} />
      <View style={styles.skeletonChevron} />
    </View>
  </View>
);

const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.modernSectionHeader}>
      <View style={styles.skeletonSectionTitle} />
    </View>
    {Array.from({ length: 6 }, (_, i) => (
      <SkeletonTransaction key={`skeleton-1-${i}`} />
    ))}
    <View style={styles.modernSectionHeader}>
      <View style={styles.skeletonSectionTitle} />
    </View>
    {Array.from({ length: 4 }, (_, i) => (
      <SkeletonTransaction key={`skeleton-2-${i}`} />
    ))}
  </View>
);

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
    </View>
    <Text style={styles.emptyTitle}>No transactions yet</Text>
    <Text style={styles.emptySubtitle}>
      Create a payment link or QR code to start receiving payments.
    </Text>
  </View>
);

const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{section.title}</Text>
  </View>
);

export default function TransactionList({
  sections,
  onTransactionPress,
  isLoading = false,
  isFirstVisit = true,
  refreshing = false,
  onRefresh
}: TransactionListProps): React.ReactElement {
  
  const renderTransaction = ({ item: transaction }: { item: Transaction }) => (
    <TransactionItem 
      transaction={transaction} 
      onPress={onTransactionPress} 
    />
  );

  // Only show skeleton loading on first visit
  if (isLoading && isFirstVisit) {
    return <SkeletonLoader />;
  }

  // Show empty state if no transactions
  if (sections.length === 0 || sections.every(section => section.data.length === 0)) {
    return <EmptyState />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderTransaction}
      renderSectionHeader={renderSectionHeader}
      style={styles.transactionsList}
      contentContainerStyle={styles.transactionsContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3AB75C"
            colors={["#3AB75C"]}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  transactionsList: {
    flex: 1
  },
  transactionsContent: {
    paddingBottom: 32
  },
  sectionHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.5,
    fontFamily: 'DMSans-Medium'
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  modernSectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  skeletonSectionTitle: {
    width: 120,
    height: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 6
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  skeletonCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    marginRight: 12
  },
  skeletonDetails: {
    flex: 1,
    gap: 6
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 4
  },
  skeletonTime: {
    width: '40%',
    height: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 4
  },
  skeletonAmountSection: {
    alignItems: 'flex-end',
    gap: 8,
    flexDirection: 'row'
  },
  skeletonAmount: {
    width: 80,
    height: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 4
  },
  skeletonChevron: {
    width: 16,
    height: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 4
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 50,
    backgroundColor: '#f9fafb',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'DMSans-Medium',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'DMSans-Medium',
  },
});