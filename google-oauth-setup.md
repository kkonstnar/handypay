# Google OAuth Setup Guide

## Current Configuration

Your app is configured with:
- **Client ID**: 372273128345-josn5129vti7h8o17h0lbeskd0p46c6g.apps.googleusercontent.com
- **Development Mode**: Using Expo proxy
- **Expected Redirect URI**: exp://YOUR_LOCAL_IP:8081/--/expo-auth-session

## Google Cloud Console Setup

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Navigate to OAuth Consent Screen
- APIs & Services → OAuth consent screen
- Make sure "User Type" is set to "External"
- Add your test email: kylecampbelltest2001@gmail.com

### 3. Add Authorized Redirect URIs

Add these redirect URIs to your OAuth client:

```
# For Expo Development (this is the key one!)
https://auth.expo.io/@kylekonstnar/handypay-mobile

# Alternative Expo proxy URLs (if needed)
https://auth.expo.io/handypay-mobile

# For Production (when you deploy)
handypay://oauth/callback
```

**IMPORTANT**: The main redirect URI for development should be:
```
https://auth.expo.io/@kylekonstnar/handypay-mobile
```

This is the standard Expo proxy URL that Google OAuth accepts.

### 4. Check Your Local IP
Run this command to find your local IP:
```bash
ipconfig getifaddr en0  # macOS
ip route get 1 | awk '{print $7}'  # Linux
```

### 5. Test the Setup
1. Start your Expo development server
2. Note the redirect URI in the console logs
3. Add that exact URI to Google Cloud Console
4. Try Google authentication again

## Troubleshooting

If you still get "Access blocked" error:

1. **Double-check redirect URI**: Make sure it matches exactly
2. **Verify test user**: Ensure your email is added as a test user
3. **Check app publication**: Keep it in "Testing" mode for development
4. **Clear Expo cache**: `npx expo start --clear`

## Expected Console Output

After successful setup, you should see:
```
✅ Google Auth Configuration:
   - Redirect URI: https://auth.expo.io/@kylekonstnar/handypay-mobile
   - Client ID: 372273128345-...
   - Development mode: true
✅ Google OAuth success: { code: "...", redirectUri: "..." }
```

## Quick Fix for "Invalid Redirect" Error

If you see "Invalid Redirect: must use either http or https as the scheme":

1. **Go to Google Cloud Console**
2. **Add this exact redirect URI:**
   ```
   https://auth.expo.io/@kylekonstnar/handypay-mobile
   ```
3. **Remove any `exp://` URIs** - Google OAuth doesn't accept them
4. **Save and try again**

## Alternative Fix (if the above doesn't work)

If the standard Expo proxy URL doesn't work, try:

1. **Run your Expo development server:**
   ```bash
   npx expo start --clear
   ```

2. **Open the Expo Developer Tools in your browser**
3. **Check the "Connection" section** for your tunnel URL
4. **Use that HTTPS URL in Google Cloud Console**

## Most Common Issues

1. **Wrong redirect URI**: Must be `https://auth.expo.io/@kylekonstnar/handypay-mobile`
2. **Missing test user**: Add `kylecampbelltest2001@gmail.com` as test user
3. **App not in testing mode**: Keep OAuth app in "Testing" mode
4. **Client ID mismatch**: Ensure correct client ID in environment variables
