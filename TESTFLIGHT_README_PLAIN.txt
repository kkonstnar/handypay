HandyPay TestFlight Testing Guide

QUICK START
1. Launch the app
2. Choose your login method:
   - Option A: Continue with Google/Apple - Regular Users
   - Option B: Email Login - Click "Continue with Email" and enter:
     * Email: test@example.com
     * Password: test123
3. Go through the complete onboarding flow:
   - Biometrics setup (Face ID/Touch ID or passcode)
   - Privacy policy acceptance
   - Feature highlights
   - Legal agreements

STRIPE ONBOARDING - OPTIONAL
- Can be skipped initially - you can explore the app without completing Stripe setup
- Test information only - no real bank account or identity verification required
- Accepts test data for all fields during onboarding

IMPORTANT LIMITATIONS
Without completing Stripe onboarding, you cannot:
- Generate QR codes for payments
- Create payment links
- Process real transactions

RESTARTING THE PROCESS
To test different scenarios or start fresh:
1. Click your avatar (top right corner of main screen)
2. Select "Password & Security"
3. Choose "Delete Account" or logout to restart

KEY FEATURES TO TEST

ALWAYS AVAILABLE (NO STRIPE REQUIRED)
- Biometric authentication with passcode fallback
- Navigation between screens (Home, Activity, Wallet)
- App settings and preferences
- Account management options

REQUIRES STRIPE ONBOARDING
- QR code generation for payments
- Payment link creation
- Transaction processing
- Bank account connection

TESTING SCENARIOS

SCENARIO 1: FULL EXPERIENCE
1. Complete Stripe onboarding with test information
2. Test all payment features (QR codes, payment links)
3. Verify transaction history shows correctly

SCENARIO 2: LIMITED EXPERIENCE
1. Skip Stripe onboarding
2. Verify app navigation and basic features work
3. Confirm payment features show appropriate messages

SCENARIO 3: ACCOUNT MANAGEMENT
1. Test logout functionality
2. Test account deletion and recreation
3. Verify biometric settings persist/clear appropriately

BUG REPORTING
If you encounter any issues:
1. Note the exact steps that led to the problem
2. Describe what you expected vs. what happened
3. Include screenshots if possible
4. Mention your device type and iOS version

EXPECTED BEHAVIOR

TEST ACCOUNT BUTTON
- Should immediately load demo user
- Navigate through full onboarding flow
- Show realistic demo data and transactions

BIOMETRIC AUTHENTICATION
- Face ID/Touch ID should work if available
- Passcode fallback should work for all devices
- Clear error messages if authentication fails

STRIPE INTEGRATION
- Mock data should work for all non-payment features
- Payment features should show helpful messages when unavailable
- Test Stripe onboarding should accept any reasonable test data

Thank you for testing HandyPay! Your feedback helps us build a better payment experience.

Test Build Version: 1.0.0 (Build #4)
