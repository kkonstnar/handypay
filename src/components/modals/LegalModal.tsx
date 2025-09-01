import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import * as Haptics from 'expo-haptics';

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
}

type LegalModalNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LegalModal({ visible, onClose }: LegalModalProps): React.ReactElement {
  const navigation = useNavigation<LegalModalNavigationProp>();

  const handleTermsPress = () => {
    onClose();
    navigation.navigate('TermsContentPage');
  };

  const handlePrivacyPress = () => {
    onClose();
    navigation.navigate('PrivacyPage');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Legal</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Review our terms and policies to understand your rights and responsibilities.
          </Text>

          <View style={styles.legalContent}>
          <TouchableOpacity
            style={styles.legalOption}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleTermsPress();
            }}
          >
            <View style={styles.legalOptionText}>
              <Text style={styles.legalOptionTitle}>Terms of Service</Text>
              <Text style={styles.legalOptionDescription}>Review our terms and conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalOption, styles.lastLegalOption]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handlePrivacyPress();
            }}
          >
            <View style={styles.legalOptionText}>
              <Text style={styles.legalOptionTitle}>Privacy Policy</Text>
              <Text style={styles.legalOptionDescription}>Learn how we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'DMSans-Medium'
  },
  legalContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginTop: 8,
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
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  }
});