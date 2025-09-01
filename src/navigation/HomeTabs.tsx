import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import HomeScreen from '../screens/home/HomeScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ActivityScreen from '../screens/activity/ActivityScreen';
import { BiometricAuthService } from '../services';
import { useUser } from '../contexts/UserContext';
import SafetyPinModal from '../components/modals/SafetyPinModal';

function PlaceholderScreen({ label }: { label: string }): React.ReactElement {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{label}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

// Custom tab bar with haptic feedback
function CustomTabBar({ state, descriptors, navigation }: any): React.ReactElement {
  const { user } = useUser();
  const [showSafetyPinAuth, setShowSafetyPinAuth] = React.useState(false);
  const [pendingRoute, setPendingRoute] = React.useState<string | null>(null);
  return (
    <View style={{
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#f3f4f6',
      backgroundColor: '#ffffff',
      height: 90,
      paddingBottom: 20,
      paddingTop: 10
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = route.name;
        const isFocused = state.index === index;

        const onPress = async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // Require authentication for Payouts (Wallet) screen if enabled
            if (route.name === 'Payouts') {
              if (user?.faceIdEnabled) {
                // Use Face ID authentication
                const authenticated = await BiometricAuthService.authenticateWithPrompt(
                  'Authenticate to access your wallet',
                  {
                    showErrorAlert: true,
                    allowRetry: true,
                    onSuccess: () => {
                      navigation.navigate(route.name);
                    }
                  }
                );
              } else if (user?.safetyPinEnabled) {
                // Use Safety PIN authentication
                setPendingRoute(route.name);
                setShowSafetyPinAuth(true);
              } else {
                // No authentication required
                navigation.navigate(route.name);
              }
            } else {
              navigation.navigate(route.name);
            }
          }
        };

        const color = isFocused ? '#3AB75C' : '#717171';
        const size = 26;

        let icon;
        if (route.name === 'Home') {
          icon = (
            <Svg width={size} height={size * 18/21} viewBox="0 0 21 18" fill="none">
              <Path d="M18.9965 12.2725C18.5884 12.2725 18.1802 12.5793 18.1802 13.0907V15.1361C18.1802 15.852 17.5679 16.3634 16.9557 16.3634H14.9149C14.5067 16.3634 14.0986 16.6702 14.0986 17.1816C14.0986 17.6929 14.4047 17.9998 14.9149 17.9998H16.9557C18.4863 17.9998 19.8128 16.7725 19.8128 15.1361V13.0907C19.8128 12.6816 19.4047 12.2725 18.9965 12.2725Z" fill={color}/>
              <Path d="M14.9149 1.63637H16.9557C17.67 1.63637 18.1802 2.25 18.1802 2.86364V4.90909C18.1802 5.31818 18.4864 5.72727 18.9966 5.72727C19.5068 5.72727 19.8129 5.42046 19.8129 4.90909V2.86364C19.8129 1.32955 18.5884 0 16.9557 0H14.9149C14.5068 0 14.0986 0.30682 14.0986 0.81818C14.0986 1.32955 14.5068 1.63637 14.9149 1.63637Z" fill={color}/>
              <Path d="M6.75147 16.3634H4.71066C3.99637 16.3634 3.48617 15.7498 3.48617 15.1361V13.0907C3.48617 12.6816 3.18005 12.2725 2.66984 12.2725C2.15964 12.2725 1.85352 12.6816 1.85352 13.0907V15.1361C1.85352 16.6702 3.07801 17.9998 4.71066 17.9998H6.75147C7.15964 17.9998 7.5678 17.6929 7.5678 17.1816C7.5678 16.6702 7.15964 16.3634 6.75147 16.3634Z" fill={color}/>
              <Path d="M2.66984 5.72727C3.07801 5.72727 3.48617 5.42046 3.48617 4.90909V2.86364C3.48617 2.14773 4.09842 1.63637 4.71066 1.63637H6.75148C7.15964 1.63637 7.5678 1.32955 7.5678 0.81818C7.5678 0.30682 7.15964 0 6.75148 0H4.71066C3.18005 0 1.85352 1.32955 1.85352 2.86364V4.90909C1.85352 5.31818 2.26168 5.72727 2.66984 5.72727Z" fill={color}/>
              <Path d="M14.915 15.1363C16.0375 15.1363 16.9559 14.2159 16.9559 13.0909V11.25H4.71094V13.0909C4.71094 14.2159 5.62931 15.1363 6.75176 15.1363H14.915Z" fill={color}/>
              <Path d="M20.0167 8.18143H16.9555V4.90873C16.9555 3.78373 16.0371 2.86328 14.9146 2.86328H6.75138C5.62893 2.86328 4.71056 3.78373 4.71056 4.90873V8.38603H1.64934C1.24117 8.38603 0.833008 8.69283 0.833008 9.20423C0.833008 9.71553 1.13913 10.0223 1.64934 10.0223H20.0167C20.4248 10.0223 20.833 9.71553 20.833 9.20423C20.833 8.69283 20.4248 8.18143 20.0167 8.18143Z" fill={color}/>
            </Svg>
          );
        } else if (route.name === 'Activity') {
          icon = (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill={color}/>
              <Path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill={color}/>
            </Svg>
          );
        } else if (route.name === 'Payouts') {
          icon = (
            <Svg width={size} height={size * 20/21} viewBox="0 0 21 20" fill="none">
              <Path d="M14.5469 8.62988H18.2198V15.116H14.5469V8.62988Z" fill={color}/>
              <Path d="M8.29492 8.62988H11.9678V15.116H8.29492V8.62988Z" fill={color}/>
              <Path d="M18.9211 16.2881C18.3311 16.2881 2.05231 16.2881 1.33821 16.2881C0.691862 16.2881 0.166016 16.8139 0.166016 17.4603V18.8278C0.166016 19.4742 0.691862 20 1.33821 20H18.9211C19.5675 20 20.0933 19.4742 20.0933 18.8278V17.4603C20.0933 16.8139 19.5675 16.2881 18.9211 16.2881Z" fill={color}/>
              <Path d="M19.3588 3.67988C10.33 -0.0118684 10.5716 0.0868696 10.5651 0.0842517C10.2865 -0.0272241 9.97674 -0.0294903 9.69018 0.0858927L0.900591 3.67988C0.454258 3.85946 0.166016 4.28606 0.166016 4.76733V6.28512C0.166016 6.93147 0.691862 7.45732 1.33821 7.45732H18.9211C19.5675 7.45732 20.0933 6.93147 20.0933 6.28512V4.76733C20.0933 4.28606 19.8051 3.85946 19.3588 3.67988ZM10.7158 4.3705C10.7158 4.69418 10.4534 4.9566 10.1297 4.9566C9.80599 4.9566 9.54357 4.69418 9.54357 4.3705V3.12016C9.54357 2.79648 9.80599 2.53406 10.1297 2.53406C10.4534 2.53406 10.7158 2.79648 10.7158 3.12016V4.3705Z" fill={color}/>
              <Path d="M2.04297 8.62988H5.71585V15.116H2.04297V8.62988Z" fill={color}/>
            </Svg>
          );
        } else {
          icon = <Ionicons name="wallet" size={size} color={color} />;
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
            <Text style={{
              color,
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
      
      <SafetyPinModal
        visible={showSafetyPinAuth}
        onClose={() => {
          setShowSafetyPinAuth(false);
          setPendingRoute(null);
        }}
        mode="verify"
        onVerificationSuccess={() => {
          setShowSafetyPinAuth(false);
          if (pendingRoute) {
            navigation.navigate(pendingRoute);
            setPendingRoute(null);
          }
        }}
        title="Enter Safety PIN"
        subtitle="Enter your 6-digit Safety PIN to access your wallet"
      />
    </View>
  );
}

export default function HomeTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={() => ({
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Payouts" component={WalletScreen} />
    </Tab.Navigator>
  );
}
