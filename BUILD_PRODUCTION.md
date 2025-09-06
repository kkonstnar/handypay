# Production Build Guide

## 🚀 Building for TestFlight

Follow these steps to build and submit your app to TestFlight.

## 📋 Pre-Build Checklist

### Environment Setup ✅

- [x] Production environment variables configured
- [x] EAS secrets set up for production
- [x] Stripe live keys configured (not test keys)
- [x] Google/Apple OAuth production credentials

### App Configuration ✅

- [x] Bundle identifier: `com.handypay.mobile`
- [x] Version: `1.0.0`, Build: `1`
- [x] App Store metadata configured
- [x] Privacy manifest updated
- [x] Deep linking configured

### Developer Account ✅

- [ ] Apple Developer Program account active
- [ ] App Store Connect app created
- [ ] Bundle ID registered in Apple Developer
- [ ] App Store Connect app ID noted

## 🔐 EAS Secrets Setup

Before building, set up your production secrets:

```bash
# Set production Stripe keys
eas secret:create --scope project --name STRIPE_LIVE_SECRET_KEY --value "sk_live_..."
eas secret:create --scope project --name NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY --value "pk_live_..."

# Set OAuth credentials
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "your_production_google_client_id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_SECRET --value "your_production_google_client_secret"

# Set App Store Connect credentials
eas secret:create --scope project --name APPLE_ID --value "your_apple_developer_email@example.com"
eas secret:create --scope project --name ASC_APP_ID --value "your_app_store_connect_app_id"
```

## 🏗️ Build Commands

### 1. Build Production App

```bash
# Build for iOS production
eas build --platform ios --profile production

# Build for Android (if needed)
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production
```

### 2. Monitor Build Progress

The build will take 15-30 minutes. You can monitor progress at:

- [EAS Build Dashboard](https://expo.dev/accounts/your-account/projects/handypay-mobile/builds)

### 3. Download Build Artifacts

Once complete, download the `.ipa` file from the EAS dashboard.

## 🧪 Test the Build

### Install on Test Device

```bash
# List registered devices
eas device:list

# Register new device (if needed)
eas device:create

# Install build on device
eas build:run --platform ios --profile production
```

### Test Critical Features

- [ ] App launches without crashes
- [ ] Authentication flows work
- [ ] Stripe onboarding completes
- [ ] QR code generation/scanning
- [ ] Payment processing
- [ ] Deep linking functionality
- [ ] Network connectivity handling

## 📤 Submit to TestFlight

### Using EAS Submit

```bash
# Submit to TestFlight
eas submit --platform ios --profile production
```

### Manual Submission (Alternative)

1. Download the `.ipa` file from EAS Build
2. Open [App Store Connect](https://appstoreconnect.apple.com/)
3. Go to **TestFlight** > **iOS**
4. Click **+** to add a new build
5. Upload your `.ipa` file
6. Wait for processing (usually 10-30 minutes)

## 👥 Configure TestFlight Testers

### Internal Testing

1. In App Store Connect > TestFlight
2. Go to **Internal Testing**
3. Add internal testers from your team
4. Select your build and distribute

### External Testing

1. Go to **External Testing**
2. Create a testing group
3. Add external testers by email
4. Submit for Beta App Review (Apple's review process)

## 📊 Build Information

### Current Build Configuration

```
Platform: iOS
Profile: production
Bundle ID: com.handypay.mobile
Version: 1.0.0
Build: 1
Resource Class: m-medium
```

### Build Artifacts

- **iOS:** `.ipa` file for TestFlight/App Store
- **Android:** `.aab` file for Google Play (if built)

## 🚨 Build Issues & Solutions

### Common Build Errors

**❌ "Bundle identifier mismatch"**

```
Solution: Ensure bundle ID in app.json matches App Store Connect exactly
```

**❌ "Missing provisioning profile"**

```
Solution: Check that your bundle ID is registered in Apple Developer Console
```

**❌ "Secrets not found"**

```
Solution: Verify all EAS secrets are created with correct names
```

**❌ "App Store Connect authentication failed"**

```
Solution: Check APPLE_ID and ASC_APP_ID secrets are correct
```

### Build Optimization

```bash
# Clear build cache if issues persist
eas build --platform ios --profile production --clear-cache

# Build with verbose logging
eas build --platform ios --profile production --verbose
```

## 📈 Next Steps After Build

1. **TestFlight Testing Phase**

   - Distribute to internal testers
   - Collect feedback and bug reports
   - Fix critical issues

2. **App Store Preparation**

   - Prepare screenshots (all required sizes)
   - Write App Store description
   - Set up pricing and availability

3. **App Store Submission**
   - Submit for App Review
   - Monitor review status
   - Prepare for launch

## 🔍 Build Logs & Debugging

### View Build Logs

```bash
# Get build information
eas build:list

# View specific build logs
eas build:view <build-id>
```

### Common Debug Steps

1. Check build logs for specific errors
2. Verify all environment variables are set
3. Test with development build first
4. Ensure Xcode and EAS CLI are updated

## 📞 Support

If you encounter issues:

1. Check [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
2. Review [Expo Forums](https://forums.expo.dev/)
3. Check [Apple Developer Forums](https://developer.apple.com/forums/)

---

## ✅ Build Success Checklist

- [ ] EAS secrets configured correctly
- [ ] Build completes without errors
- [ ] App installs on test devices
- [ ] All features work as expected
- [ ] TestFlight submission successful
- [ ] Testers can install and use the app
- [ ] No critical bugs reported

