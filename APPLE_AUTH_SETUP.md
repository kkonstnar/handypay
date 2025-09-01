# Apple Sign-In Setup Guide

## Apple Developer Console Configuration

### 1. Create Service ID
1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Click "+" to create new Service ID
3. **Identifier**: `com.handypay.mobile.service`
4. **Description**: HandyPay Mobile Service

### 2. Configure Sign In with Apple
1. Select your Service ID (`com.handypay.mobile.service`)
2. Enable "Sign In with Apple"
3. Click "Configure"

### 3. Add Domains and Return URLs

#### Primary App ID Association
- **Primary App ID**: `com.handypay.mobile` (your main app bundle ID)

#### Domains and Subdomains
Add these domains:
- `auth.expo.io` (for Expo development)
- `yourapp.com` (your production domain)

#### Return URLs
**Development**:
```
https://auth.expo.io/@kylekonstnar/handypay-mobile
```

**Production** (replace with your domain):
```
https://yourapp.com/auth/apple/callback
```

### 4. Key Configuration (Optional - for server-side)
If handling token exchange on your backend:
1. Create a **Key** for Sign In with Apple
2. Download the `.p8` file
3. Note the Key ID
4. Use this to generate JWT client_secret on your backend

## Current App Configuration

Your app is configured to use:
- **Client ID**: `com.handypay.mobile.service`
- **Redirect URI**: `https://auth.expo.io/@kylekonstnar/handypay-mobile` (dev)
- **Scopes**: `name`, `email`

## Testing
1. Must test on physical iOS device (not simulator)
2. Ensure your Apple ID is signed in on the device
3. Check console logs for detailed authentication flow

## Common Issues
- **"Invalid client_id"**: Service ID not configured properly
- **"Invalid redirect_uri"**: Return URL not added to Apple console
- **"Domain not verified"**: Domain not added to Apple console configuration