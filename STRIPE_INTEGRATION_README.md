# Stripe Connect Hosted Onboarding Integration

This document outlines the implementation of Stripe Connect hosted onboarding for the HandyPay mobile app.

## Overview

The integration allows users to create and verify Stripe Connect accounts directly through the mobile app using Stripe's hosted onboarding flow. This enables users to accept payments through the HandyPay platform.

## Architecture

### Backend Components

#### 1. Stripe Service (`handypay-backend/src/stripe.ts`)

- Handles Stripe API interactions
- Creates and updates Stripe Connect accounts
- Generates account onboarding links
- Retrieves account status information
- Manages user-Stripe account mapping

#### 2. API Endpoints (`handypay-backend/src/index.ts`)

- `POST /api/stripe/create-account-link` - Creates onboarding links
- `GET /api/stripe/account-status/:accountId` - Retrieves account status
- `GET /api/stripe/user-account/:userId` - Gets user's Stripe account ID

#### 3. Database Schema (`handypay-backend/src/schema.ts`)

- Extended users table with `stripeAccountId` field
- Uses Drizzle ORM for database operations

### Mobile App Components

#### 1. GetStartedPage (`src/screens/onboarding/GetStartedPage.tsx`)

- Initiates Stripe onboarding process
- Handles deep links from Stripe completion
- Provides user interface for starting onboarding

#### 2. SuccessPage (`src/screens/onboarding/SuccessPage.tsx`)

- Displays onboarding completion status
- Checks Stripe account verification status
- Provides appropriate messaging based on account state

## Implementation Details

### Account Creation Flow

1. User clicks "Get started" on the GetStartedPage
2. App sends user data to backend API
3. Backend creates/updates Stripe Connect account
4. Backend generates account onboarding link
5. App opens Stripe hosted onboarding in browser
6. User completes onboarding on Stripe's site
7. Stripe redirects back to app via deep link
8. App shows success page with account status

### Account Configuration

- **Country**: Jamaica (JM)
- **Currency**: Jamaican Dollar (JMD)
- **Business Type**: Individual
- **Capabilities**: Transfers enabled
- **Payout Schedule**: Weekly on Tuesdays

### Deep Linking

The app handles deep links for onboarding completion:

- URL Scheme: `handypay://`
- Automatically detects Stripe onboarding callbacks
- Navigates to success page upon completion

## Environment Variables

Add to your backend environment:

```env
STRIPE_TEST_SECRET_KEY=sk_test_...
DATABASE_URL=your_database_url
```

## Database Migration

Run the migration to add the Stripe account ID column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);
```

## Testing

1. Ensure Stripe test keys are configured
2. Test account creation and onboarding flow
3. Verify account status checking
4. Test deep link handling

## Error Handling

- Comprehensive error handling for Stripe API failures
- User-friendly error messages
- Fallbacks for missing account data
- Proper logging for debugging

## Security Considerations

- Stripe secrets stored securely in environment variables
- User data validated before API calls
- Account IDs stored securely in database
- No sensitive payment data stored in app

## Next Steps

1. Deploy backend changes to production
2. Run database migration
3. Test end-to-end flow with Stripe test accounts
4. Configure production Stripe keys when ready
5. Add webhook handling for account status updates (optional)
