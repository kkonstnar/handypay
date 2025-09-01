import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props: any) => (
    <View style={styles.successToast}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark" size={20} color="#ffffff" />
      </View>
      <Text style={styles.toastText}>{props.text1}</Text>
    </View>
  ),
  
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#F87171' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        fontFamily: 'DMSans-Medium'
      }}
      text2Style={{
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'DMSans-Regular'
      }}
    />
  ),
  
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3B82F6' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        fontFamily: 'DMSans-Medium'
      }}
      text2Style={{
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'DMSans-Regular'
      }}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'DMSans-Medium',
    flex: 1,
  },
});

export default toastConfig;