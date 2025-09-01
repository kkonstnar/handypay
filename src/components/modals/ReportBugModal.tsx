import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Alert, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { apiService } from '../../services/api';

interface ReportBugModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportBugModal({ visible, onClose }: ReportBugModalProps): React.ReactElement {
  const [bugReportText, setBugReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (bugReportText.trim()) {
      try {
        setIsSubmitting(true);
        const response = await apiService.reportBug(bugReportText.trim());
        
        if (response.success) {
          Alert.alert('Report Sent', `Thank you for your feedback! We'll look into this issue. Ticket ID: ${(response.data as any)?.ticketId || 'N/A'}`);
          setBugReportText('');
          onClose();
        } else {
          Alert.alert('Error', response.error || 'Failed to submit bug report');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to submit bug report. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Alert.alert('Description Required', 'Please describe the issue you encountered.');
    }
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
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Report a Bug</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSend();
            }}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={[styles.sendText, isSubmitting && { opacity: 0.5 }]}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={styles.inputLabel}>Describe the issue</Text>
          <TextInput
            style={styles.bugReportInput}
            value={bugReportText}
            onChangeText={setBugReportText}
            placeholder="Tell us what happened..."
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>
            Please include details about what you were doing when the issue occurred.
          </Text>
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
    minHeight: 120,
    marginBottom: 12,
    fontFamily: 'DMSans-Medium'
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    fontFamily: 'DMSans-Medium'
  }
});