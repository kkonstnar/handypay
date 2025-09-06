import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

const languages = [
  { label: 'Arabic', value: 'ar' },
  { label: 'Chinese (Simplified)', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Spanish', value: 'es' }
];

export default function LanguageModal({ visible, onClose }: LanguageModalProps): React.ReactElement {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const getLanguageLabel = (value: string) => {
    return languages.find(lang => lang.value === value)?.label || 'English';
  };

  const handleDone = () => {
    onClose();
    Alert.alert('Language Updated', `Language changed to ${getLanguageLabel(selectedLanguage)}`);
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
          <Text style={styles.modalTitle}>Language</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleDone();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.sendText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.languageContent}>
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              Select your preferred language for the app interface.
            </Text>
            <Text style={styles.currentLanguageText}>
              Current: {getLanguageLabel(selectedLanguage)}
            </Text>
          </View>
          
          {Platform.OS === 'ios' ? (
            <Picker
              selectedValue={selectedLanguage}
              onValueChange={(itemValue) => {
                // Force selection back to English if user tries to select anything else
                if (itemValue !== 'en') {
                  setSelectedLanguage('en');
                } else {
                  setSelectedLanguage(itemValue);
                }
              }}
              style={styles.pickerIOS}
              itemStyle={styles.pickerItemIOS}
            >
              {languages.map((language) => (
                <Picker.Item 
                  key={language.value} 
                  label={language.label} 
                  value={language.value}
                />
              ))}
            </Picker>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedLanguage}
                onValueChange={(itemValue) => {
                  // Force selection back to English if user tries to select anything else
                  if (itemValue !== 'en') {
                    setSelectedLanguage('en');
                  } else {
                    setSelectedLanguage(itemValue);
                  }
                }}
                style={styles.picker}
              >
                {languages.map((language) => (
                  <Picker.Item 
                    key={language.value} 
                    label={language.label} 
                    value={language.value}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>
          )}
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
  languageContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  descriptionSection: {
    paddingVertical: 24,
    paddingHorizontal: 8
  },
  descriptionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'DMSans-Medium'
  },
  currentLanguageText: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'DMSans-Medium'
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 8,
    marginTop: 16,
    ...(Platform.OS === 'ios' ? {
      borderWidth: 0,
    } : {
      borderWidth: 1,
      borderColor: '#e5e7eb'
    })
  },
  picker: {
    backgroundColor: 'transparent'
  },
  pickerIOS: {
    backgroundColor: 'transparent',
    width: '100%',
    height: 200
  },
  pickerItem: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  },
  pickerItemIOS: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'DMSans-Medium'
  }
});