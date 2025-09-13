# Push Notification Setup Guide

## Overview

This guide covers the complete setup of push notifications for HandyPay, including Apple Developer configuration, EAS Build setup, and backend API integration.

## Prerequisites

- Apple Developer Account ($99/year)
- Expo Application Services (EAS) account
- HandyPay app registered in App Store Connect

## 1. Apple Developer Portal Setup

### Create APNs Auth Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click **+** to create a new key
4. Key Name: `HandyPay Push Key`
5. Check: `Apple Push Notifications service (APNs)`
6. Click **Continue**
7. Download: `AuthKey_[KEY_ID].p8`
8. **Save the Key ID** (shown on screen)

### Enable Push Notifications for App ID

1. Go to **Identifiers** → **App IDs**
2. Select your app ID (`com.handypay.mobile`)
3. Check **Push Notifications** capability
4. Click **Save**

### Create Provisioning Profile

1. Go to **Profiles** → Click **+**
2. Select **iOS App Development**
3. App ID: `com.handypay.mobile`
4. Select your **development certificate** (not push certificate)
5. Select registered test devices
6. Profile Name: `HandyPay Development`
7. Generate → Download → Double-click to install

## 2. EAS Build Configuration

### Add EAS Secrets

```bash
# Key ID from Apple Developer Portal
eas secret:create --name EXPO_APPLE_PUSH_KEY_ID --value "YOUR_KEY_ID"

# Private key content from .p8 file
eas secret:create --name EXPO_APPLE_PUSH_PRIVATE_KEY --value "$(cat AuthKey_[KEY_ID].p8)"
```

### App Configuration

#### app.json
```json
{
  "ios": {
    "entitlements": {
      "aps-environment": "development"
    }
  },
  "notification": {
    "icon": "./assets/notification-icon.png",
    "color": "#3AB75C",
    "iosDisplayInForeground": true
  }
}
```

#### iOS Entitlements
```xml
<!-- ios/HandyPay/HandyPay.entitlements -->
<key>aps-environment</key>
<string>development</string>
```

#### Info.plist
```xml
<!-- ios/HandyPay/Info.plist -->
<key>NSUserNotificationsUsageDescription</key>
<string>HandyPay uses notifications to alert you about payments and account status.</string>
```

## 3. Backend API Setup

### Available Endpoints

#### Send Individual Notification
```
POST /api/push-notifications/send
```

Request Body:
```json
{
  "userId": "user_id_here",
  "type": "payment_received",
  "title": "Payment Received",
  "body": "You received $25.00",
  "data": {
    "paymentId": "pay_123",
    "amount": 25.00
  }
}
```

#### Broadcast to Multiple Users
```
POST /api/push-notifications/broadcast
```

### Notification Types

| Type | Priority | Use Case |
|------|----------|----------|
| `payment_received` | High | Money received |
| `payout_completed` | High | Payout sent |
| `payment_link_expired` | Default | Link expired |
| `qr_expired` | Default | QR expired |
| `account_banned` | High | Account restricted |

## 4. Frontend Integration

### Notification Handler Setup

```typescript
// App.tsx or main entry point
import { NotificationService } from './src/services/notificationService';

NotificationService.initialize();
NotificationService.setupBanNotificationListener((banDetails) => {
  // Handle ban notifications
  showBanNotification(banDetails);
});
```

### Permission Request

```typescript
// During onboarding
const result = await NotificationService.setupNotifications();
if (result.success) {
  // Notifications enabled
  navigation.navigate('NextScreen');
}
```

## 5. Testing Notifications

### Test Ban Notification
```bash
curl -X POST https://handypay-backend.handypay.workers.dev/api/push-notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "type": "account_banned",
    "title": "Account Restricted",
    "body": "Your account has been restricted",
    "data": {
      "reason": "Violation of terms",
      "type": "manual"
    }
  }'
```

### Test Payment Notification
```bash
curl -X POST https://handypay-backend.handypay.workers.dev/api/push-notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "type": "payment_received",
    "title": "Payment Received",
    "body": "You received $25.00 from John Doe",
    "data": {
      "paymentId": "pay_123",
      "amount": 25.00,
      "senderName": "John Doe"
    }
  }'
```

## 6. Production Deployment

### Switch to Production Environment

#### Update Entitlements
```xml
<!-- ios/HandyPay/HandyPay.entitlements -->
<key>aps-environment</key>
<string>production</string>
```

#### Update EAS Secrets
```bash
# Use production APNs certificate/key
eas secret:update EXPO_APPLE_PUSH_KEY_ID --value "PRODUCTION_KEY_ID"
eas secret:update EXPO_APPLE_PUSH_PRIVATE_KEY --value "$(cat ProductionAuthKey.p8)"
```

### Create Production Provisioning Profile

1. **iOS Distribution** profile type
2. Include production certificate
3. For App Store submission

## 7. Troubleshooting

### Common Issues

#### No Push Notifications Received
- Check APNs Auth Key is correct
- Verify EAS secrets are set
- Confirm app has notification permissions
- Check device is registered for push

#### Certificate Trust Issues
- Use APNs Auth Key instead of certificates
- Avoid certificate installation issues
- Easier to manage and rotate

#### Environment Mismatch
- Development: `aps-environment = "development"`
- Production: `aps-environment = "production"`

### Debug Commands

```bash
# Check EAS secrets
eas secret:list

# Check notification permissions
# In app: Settings → Notifications → HandyPay

# Test notification delivery
# Use Expo notification tool or backend API
```

## 8. Security Considerations

- Store APNs Auth Keys securely in EAS secrets
- Rotate keys regularly (Apple recommends yearly)
- Use different keys for development/production
- Monitor notification delivery rates
- Implement proper error handling

## 9. Monitoring & Analytics

### Track Notification Success
- Backend logs show delivery status
- Monitor push token registration
- Track user engagement with notifications
- Handle failed deliveries gracefully

### Notification Metrics
- Delivery success rate
- User interaction rates
- Token registration success
- Error rates by notification type

## 10. Maintenance

### Regular Tasks
- Monitor APNs certificate/key expiration
- Rotate keys before expiration
- Update provisioning profiles
- Test notification delivery
- Monitor backend notification logs

### Key Expiration
- APNs Auth Keys: Valid indefinitely (but rotate yearly)
- Development certificates: 1 year
- Production certificates: 1 year
- Provisioning profiles: 1 year

---

## Quick Setup Checklist

- [ ] Create APNs Auth Key in Apple Developer Portal
- [ ] Enable Push Notifications for App ID
- [ ] Create iOS App Development provisioning profile
- [ ] Add EAS secrets (Key ID + Private Key)
- [ ] Update app.json and entitlements
- [ ] Test notification permissions
- [ ] Test ban notifications via API
- [ ] Deploy to production with production certificates

For detailed Apple Developer setup, refer to: https://developer.apple.com/documentation/usernotifications
