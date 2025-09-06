# App Store Preparation Guide

## 📱 Required Screenshots (iOS)

You need to prepare the following screenshots for App Store submission:

### iPhone Screenshots (Required)

- **iPhone 6.9" Display** (1290 x 2796 pixels) - iPhone 15 Pro Max, iPhone 15 Plus
- **iPhone 6.7" Display** (1290 x 2796 pixels) - iPhone 15 Pro, iPhone 15
- **iPhone 6.3" Display** (1179 x 2556 pixels) - iPhone 14 Pro
- **iPhone 6.1" Display** (1179 x 2556 pixels) - iPhone 14, iPhone 13, iPhone 13 Pro

### iPad Screenshots (Optional but Recommended)

- **iPad Pro (3rd gen) 12.9" Display** (2048 x 2732 pixels)
- **iPad Pro (2nd gen) 12.9" Display** (2048 x 2732 pixels)

## 📸 Screenshot Guidelines

### Key Screens to Capture:

1. **Welcome/Login Screen** - Show your app's first impression
2. **Home/Dashboard** - Main functionality overview
3. **QR Code Generation** - Core payment feature
4. **QR Code Scanning** - Payment acceptance
5. **Payment Success** - Transaction completion
6. **Transaction History** - Activity tracking

### Design Tips:

- ✅ Use real device screenshots (not simulator)
- ✅ Show the app in use with realistic data
- ✅ Highlight key features and UI elements
- ✅ Use consistent background and styling
- ✅ Include text overlays if needed to explain features

## 🏷️ App Store Metadata

### App Information (App Store Connect)

```
Name: HandyPay
Subtitle: Simple & Secure Mobile Payments
Description: [Use the description from app.json]
Keywords: payments, qr code, stripe, mobile payments, business, transactions
Support URL: https://your-support-site.com
Marketing URL: https://handypay.com
```

### Version Information

```
What's New in Version 1.0.0:
- Scan QR codes for instant payments
- Generate payment links for customers
- Secure biometric authentication
- Real-time transaction tracking
- Seamless Stripe integration
- Easy business onboarding
```

### App Privacy (Required for iOS 17+)

Your app's privacy practices are already configured in the PrivacyInfo.xcprivacy file.

## 🛠️ Pre-Submission Checklist

- [ ] All screenshots prepared in correct sizes
- [ ] App description written and proofread
- [ ] Keywords optimized for discoverability
- [ ] Support and marketing URLs ready
- [ ] Privacy policy URL configured
- [ ] TestFlight build tested thoroughly
- [ ] App Store Connect app record created
- [ ] Bundle ID matches exactly: `com.handypay.mobile`

## 🚀 Submission Steps

1. **Build Production App:**

   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to TestFlight:**

   ```bash
   eas submit --platform ios --profile production
   ```

3. **Prepare App Store Connect:**
   - Upload screenshots
   - Fill in app information
   - Set pricing and availability
   - Submit for review

## 📋 Common Issues & Solutions

### Build Issues:

- **Bundle ID mismatch**: Ensure `com.handypay.mobile` matches App Store Connect
- **Missing entitlements**: Check Sign In with Apple configuration
- **Icon size errors**: Verify all icon files are correct dimensions

### Submission Issues:

- **Missing screenshots**: Ensure all required sizes are uploaded
- **Privacy policy**: Must be publicly accessible URL
- **App description**: Keep under 4000 characters

### Review Issues:

- **Guideline violations**: Test all features thoroughly
- **Crash reports**: Monitor TestFlight for crashes
- **Metadata issues**: Double-check all URLs and descriptions

