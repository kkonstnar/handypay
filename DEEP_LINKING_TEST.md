# Deep Linking Test Guide

## 🔗 Deep Link URLs to Test

Your app supports the following deep link schemes:

- `handypay://` (main app scheme)
- `exp://` (Expo development scheme)
- `exps://` (Expo production scheme)
- `handypay-oauth://` (OAuth callback scheme)

## 🧪 Test Scenarios

### 1. Stripe Onboarding Completion

**URL:** `handypay://stripe/complete`
**Expected Behavior:**

- App opens directly to success page
- Stripe onboarding marked as complete
- User navigated to home screen

**Test Steps:**

1. Complete Stripe onboarding flow
2. Verify deep link triggers correctly
3. Confirm no infinite polling loops

### 2. Stripe Onboarding Refresh

**URL:** `handypay://stripe/refresh`
**Expected Behavior:**

- App refreshes onboarding status
- Updates user context with latest Stripe data
- Handles both success and failure cases

### 3. OAuth Callbacks (Google/Apple)

**URLs:**

- `handypay-oauth://oauth/google`
- `handypay-oauth://oauth/apple`

**Expected Behavior:**

- OAuth flow completes successfully
- User data updated in context
- Proper navigation after authentication

## 🛠️ Testing Commands

### Local Testing (Development)

```bash
# Test deep links on iOS Simulator
xcrun simctl openurl booted "handypay://stripe/complete"

# Test on physical device (replace UDID)
xcrun devicectl device info list
xcrun devicectl device process launch --device-udid <UDID> --activate "handypay://stripe/complete"
```

### EAS Build Testing

```bash
# Build development version for testing
eas build --platform ios --profile development

# Install on test device
eas device:create
eas build:run --platform ios --profile development
```

## 🔍 Deep Link Validation Checklist

### iOS Configuration ✅

- [x] Bundle identifier: `com.handypay.mobile`
- [x] URL schemes configured in Info.plist
- [x] Associated domains (if using universal links)
- [x] App Transport Security settings

### App.json Configuration ✅

- [x] `"scheme": "handypay"`
- [x] CFBundleURLTypes properly configured
- [x] URL schemes include: `handypay`, `exp`, `exps`, `handypay-oauth`

### Code Implementation ✅

- [x] Deep link handler in GetStartedPage.tsx
- [x] useLinking hook properly configured
- [x] Navigation logic handles all URL patterns
- [x] Error handling for malformed URLs

## 🚨 Common Issues & Solutions

### Issue: Deep links not working in production

**Solution:**

- Verify URL schemes match exactly in App Store Connect
- Test with production bundle identifier
- Check if app is properly installed on test device

### Issue: OAuth callbacks failing

**Solution:**

- Ensure `handypay-oauth` scheme is registered
- Verify OAuth provider configurations
- Check redirect URIs in Google/Apple developer consoles

### Issue: Universal Links not working

**Solution:**

- Configure associated domains in Xcode
- Upload apple-app-site-association file to your domain
- Test with actual domain (not localhost)

## 📱 Manual Testing Steps

1. **Install Test Build:**

   ```bash
   eas build --platform ios --profile development
   eas build:run --platform ios --profile development
   ```

2. **Test Each Deep Link:**

   - Open Safari on device
   - Enter each test URL
   - Verify app opens and handles correctly

3. **Test Edge Cases:**

   - App not running (cold start)
   - App running in background
   - Multiple rapid deep link calls
   - Malformed URLs

4. **Test OAuth Flows:**
   - Google Sign In deep link callback
   - Apple Sign In deep link callback
   - Error scenarios (cancelled auth, network issues)

## 🔧 Debug Commands

```bash
# Check app installation
xcrun simctl listapps booted | grep handypay

# Monitor device logs
xcrun simctl spawn booted log stream --level debug --predicate 'subsystem contains "com.handypay.mobile"'

# Test URL schemes
xcrun simctl openurl booted "handypay://test"
```

## ✅ Success Criteria

- [ ] All deep link URLs open the app correctly
- [ ] Stripe onboarding completion works via deep link
- [ ] OAuth callbacks complete authentication flow
- [ ] No crashes or infinite loops
- [ ] Proper error handling for invalid URLs
- [ ] Works on both cold start and background scenarios

