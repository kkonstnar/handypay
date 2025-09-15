import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG Icons
const successIcon = `<svg width="24" height="24" viewBox="0 0 49 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24.5 48C37.7548 48 48.5 37.2548 48.5 24C48.5 10.7452 37.7548 0 24.5 0C11.2452 0 0.5 10.7452 0.5 24C0.5 37.2548 11.2452 48 24.5 48Z" fill="#3AB75C"/>
<path d="M38.2217 17.5032L25.2289 30.4969L24.4995 31.2263L20.5883 35.1366L15.9477 30.4969L10.7773 25.3257L15.418 20.685L20.5883 25.8563L24.4995 21.945L33.5811 12.8635L38.2217 17.5032Z" fill="white"/>
</svg>`;

const errorIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="12" fill="#EF4444"/>
<path d="M8 8L16 16M16 8L8 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const infoIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="12" fill="#3B82F6"/>
<path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const warningIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="12" fill="#F59E0B"/>
<path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const CustomToast = ({ type, text1, text2, ...props }: any) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return successIcon;
      case 'error':
        return errorIcon;
      case 'info':
        return infoIcon;
      case 'cancel':
      case 'warning':
        return warningIcon;
      default:
        return infoIcon;
    }
  };

  return (
    <View style={[styles.container, props.style]}>
      <View style={styles.iconContainer}>
        <SvgXml xml={getIcon()} width="24" height="24" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'DMSans-Medium',
    lineHeight: 20,
  },
  text2: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'DMSans-Regular',
    marginTop: 2,
    lineHeight: 18,
  },
});

const toastConfig = {
  success: (props: any) => <CustomToast {...props} type="success" />,
  error: (props: any) => <CustomToast {...props} type="error" />,
  info: (props: any) => <CustomToast {...props} type="info" />,
  cancel: (props: any) => <CustomToast {...props} type="cancel" />,
};

export default toastConfig;