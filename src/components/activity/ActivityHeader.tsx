import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../ui/Avatar';

interface ActivityHeaderProps {
  onAvatarPress: () => void;
  showSearch: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchChange: (text: string) => void;
  userInitials?: string;
  userAvatarUri?: string;
}

export default function ActivityHeader({
  onAvatarPress,
  showSearch,
  searchQuery,
  onSearchToggle,
  onSearchChange,
  userInitials,
  userAvatarUri
}: ActivityHeaderProps): React.ReactElement {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Avatar 
          onPress={onAvatarPress}
          initials={userInitials}
          imageUri={userAvatarUri}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity 
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={onSearchToggle}
        >
          <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
          {showSearch ? (
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
              placeholderTextColor="#9ca3af"
            />
          ) : (
            <Text style={styles.searchPlaceholder}>Search transactions...</Text>
          )}
          {showSearch && searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'DMSans-SemiBold',
    letterSpacing: -1
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
});