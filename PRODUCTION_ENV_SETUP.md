# Production Environment Setup for TestFlight

## Required Environment Variables

Create a `.env.production` file in the root directory with the following variables:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://handypay-backend.handypay.workers.dev

# Stripe Production Keys (IMPORTANT: Use LIVE keys for production)
STRIPE_LIVE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key

# Apple Sign In Configuration
EXPO_PUBLIC_APPLE_CLIENT_ID=com.handypay.mobile
APPLE_CLIENT_ID=com.handypay.mobile

# Google OAuth Configuration (Production)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_production_google_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# EAS Submit Configuration (for TestFlight submission)
APPLE_ID=your_apple_developer_email@example.com
ASC_APP_ID=your_app_store_connect_app_id
```

## Setup Steps:

### 1. Stripe Production Keys

- Go to [Stripe Dashboard](https://dashboard.stripe.com/)
- Switch to **Live mode** (toggle in top right)
- Copy your **Publishable key** and **Secret key**
- Replace the placeholder values in your `.env.production` file

### 2. Google OAuth Production Keys

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Select your project
- Go to **APIs & Services** > **Credentials**
- Create OAuth 2.0 Client ID for iOS
- Set Bundle ID to: `com.handypay.mobile`
- Copy Client ID and Client Secret

### 3. Apple Developer Account Setup

- Ensure your bundle identifier `com.handypay.mobile` is registered
- Configure Sign In with Apple entitlement
- Set up App Store Connect app record

### 4. App Store Connect Setup

- Go to [App Store Connect](https://appstoreconnect.apple.com/)
- Create a new app or use existing one
- Copy the **Apple ID** from App Store Connect
- This will be your `ASC_APP_ID`

### 5. EAS Secrets Setup

Set up your production secrets with EAS:

```bash
# Set EAS secrets for production
eas secret:create --scope project --name STRIPE_LIVE_SECRET_KEY --value "sk_live_..."
eas secret:create --scope project --name NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY --value "pk_live_..."
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "your_google_client_id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_SECRET --value "your_google_client_secret"
eas secret:create --scope project --name APPLE_ID --value "your_apple_developer_email@example.com"
eas secret:create --scope project --name ASC_APP_ID --value "your_app_store_connect_app_id"
```

## Security Notes:

- ✅ Never commit `.env.production` to version control
- ✅ Use production/live keys for TestFlight builds
- ✅ Store secrets securely using EAS secrets
- ✅ Test thoroughly before submitting to TestFlight
