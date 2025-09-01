# Authentication Setup Guide

This guide explains how to set up Google and Apple authentication using Expo AuthSession.

## 🚀 Current Implementation

The app now includes:
- **ExpoAuthService.ts**: Complete authentication service with Google & Apple OAuth
- **StartPage**: Updated with working Google/Apple sign-in buttons
- **Environment Configuration**: OAuth client IDs already configured in `.env`

## 📱 Features

### Google Authentication
- Uses OAuth 2.0 Authorization Code flow
- Retrieves user profile information (name, email)
- Supports iOS, Android, and web platforms
- Shows loading states and user feedback

### Apple Authentication  
- Uses Apple Sign In with OAuth
- Handles authorization code exchange
- Platform-specific redirect URIs
- Proper error handling and user feedback

## 🔧 Setup Requirements

### 1. Install Dependencies
The required packages are already added to `package.json`:
```bash
npm install
# or
yarn install
```

### 2. Configuration Files

#### App Configuration (`app.json`)
✅ **Already configured** with:
- App scheme: `handypay`
- iOS URL schemes for deep linking
- Proper bundle identifiers

#### Environment Variables (`.env`)
✅ **Already configured** with:
- Google client IDs for iOS, Android, and web
- Apple Service ID
- Apple client secret (JWT token)

### 3. Platform-Specific Setup

#### iOS Configuration
✅ **Already configured** in `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "CFBundleURLTypes": [
        {
          "CFBundleURLName": "handypay-oauth",
          "CFBundleURLSchemes": ["handypay"]
        }
      ]
    }
  }
}
```

#### Android Configuration
- Deep linking scheme automatically handled by Expo

## 🧪 Testing the Authentication

### Current Flow:
1. User taps "Continue with Apple" or "Continue with Google" on StartPage
2. OAuth browser window opens with provider login
3. User completes authentication on provider's website
4. App receives authorization code via deep link
5. App exchanges code for tokens (Google) or processes directly (Apple)
6. Success/error feedback shown to user
7. Navigation to BiometricsPage on success

### Test Accounts:
- **Google**: Use any valid Google account
- **Apple**: Use any valid Apple ID (requires actual iOS device for testing)

## 🔒 Security Notes

### Google OAuth
- Uses Authorization Code flow (most secure)
- Client secrets not needed for mobile apps
- Tokens handled securely within the app

### Apple OAuth
- Token exchange should ideally be done on your backend
- Client secret (JWT) included for demonstration
- In production, move token exchange to your secure backend

## 📝 Current Implementation Details

### Key Files:
- `src/services/ExpoAuthService.ts` - Main authentication service
- `src/screens/onboarding/StartPage.tsx` - Updated with auth buttons
- `.env` - OAuth configuration (already set up)
- `app.json` - App configuration for deep linking

### Authentication Flow:
```typescript
// Google Authentication
const { request, response, promptAsync } = useGoogleAuth();

// Trigger auth
await promptAsync();

// Handle response
if (response?.type === 'success') {
  const tokens = await exchangeCodeForToken(/* ... */);
  const userInfo = await getGoogleUserInfo(tokens.access_token);
  // Navigate to next screen
}
```

## 🛠️ Production Checklist

Before going to production:

1. **Backend Integration**:
   - Move Apple token exchange to your backend
   - Implement proper user session management
   - Store user data securely

2. **Error Handling**:
   - Add comprehensive error tracking
   - Implement retry mechanisms
   - Handle network failures gracefully

3. **Security**:
   - Remove sensitive keys from client-side code
   - Implement proper token refresh logic
   - Add session timeout handling

4. **Testing**:
   - Test on physical iOS devices for Apple Sign In
   - Test all error scenarios
   - Verify deep linking works correctly

## 🚨 Ready to Use!

The authentication is **fully implemented and ready to test**:

1. Run the app: `npm start` or `yarn start`
2. Navigate to the StartPage
3. Tap "Continue with Apple" or "Continue with Google"
4. Complete the OAuth flow
5. Check console logs for authentication results

The buttons now show loading states, handle errors gracefully, and provide user feedback throughout the authentication process!