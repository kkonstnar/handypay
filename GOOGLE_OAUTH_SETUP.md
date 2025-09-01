# Google OAuth Setup Guide

## 🚨 **Current Issue: "Access blocked: authorization error"**

This error occurs when the redirect URI in your app doesn't match what's configured in Google Cloud Console.

## 📋 **Step-by-Step Fix**

### 1. **Check Your Redirect URI**

When you run the app, check the console logs for:
```
Google Auth Setup: {
  clientId: "372273128345-i4fhhj2vt9t1cktb1ujq1f9kg1rggcd9.apps.googleusercontent.com",
  redirectUri: "handypay://", // This is what needs to be configured
  scheme: "handypay"
}
```

### 2. **Configure Google Cloud Console**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (or create one)
3. **Navigate to**: APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID**: `372273128345-i4fhhj2vt9t1cktb1ujq1f9kg1rggcd9.apps.googleusercontent.com`
5. **Click Edit** (pencil icon)

### 3. **Add Authorized Redirect URIs**

In the OAuth client configuration, add these redirect URIs:

#### **For Development:**
```
handypay://
```

#### **For Expo Development (if using Expo Go):**
```
exp://127.0.0.1:19000/--/
exp://localhost:19000/--/
https://auth.expo.io/@kylekonstnar/handypay-mobile
```

#### **For Production:**
```
handypay://
com.handypay.mobile://
```

### 4. **Platform-Specific Setup**

#### **iOS Configuration:**
- **Bundle ID**: `com.handypay.mobile` (already configured in app.json)
- **Redirect URI**: `handypay://`

#### **Android Configuration:**
- **Package Name**: `com.handypay.mobile` (already configured in app.json)
- **Redirect URI**: `handypay://`

### 5. **Verify Configuration**

After updating Google Cloud Console:

1. **Save the changes**
2. **Wait 5-10 minutes** for changes to propagate
3. **Test the authentication flow again**

## 🔧 **Alternative Solutions**

### **Option 1: Use Expo's Auth Proxy (Recommended for Development)**

Update the redirect URI to use Expo's auth proxy:

```typescript
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true, // Use Expo's auth proxy
});
```

Then add to Google Cloud Console:
```
https://auth.expo.io/@kylekonstnar/handypay-mobile
```

### **Option 2: Use Different Client ID for Mobile**

You might need a separate OAuth client for mobile apps:

1. **In Google Cloud Console**:
   - Create new OAuth 2.0 Client ID
   - Choose **"iOS"** or **"Android"** application type
   - Add bundle ID: `com.handypay.mobile`

2. **Update your .env**:
   ```
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=new-ios-client-id
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=new-android-client-id
   ```

## 🧪 **Testing Steps**

1. **Run the app**: `npm start`
2. **Check console logs** for the redirect URI being used
3. **Ensure that exact URI is in Google Cloud Console**
4. **Wait 5-10 minutes** after making changes
5. **Test authentication** again

## 📝 **Common Redirect URI Formats**

| Environment | Redirect URI |
|-------------|--------------|
| **Expo Development** | `exp://127.0.0.1:19000/--/` |
| **Expo Go** | `https://auth.expo.io/@username/app-slug` |
| **Standalone App** | `handypay://` |
| **iOS Standalone** | `com.handypay.mobile://` |

## 🎯 **Quick Fix**

**Most likely solution**: Add `handypay://` to your Google OAuth client's authorized redirect URIs in Google Cloud Console, wait 5-10 minutes, then test again.

The console logs will show you the exact redirect URI being used - make sure that exact string is configured in Google Cloud Console.