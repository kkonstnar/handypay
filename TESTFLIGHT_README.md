# HandyPay TestFlight Testing Guide

## 🚀 **Quick Start**

1. **Launch the app**
2. **Choose your login method**:
   - **Option A: Test Account** - Click "Test Account (TestFlight)" button (green button on login screen)
   - **Option B: Email Login** - Click "Continue with Email" and enter:
     - Email: `test@example.com`
     - Password: `test123`
3. **Go through the complete onboarding flow**:
   - Biometrics setup (Face ID/Touch ID or passcode)
   - Privacy policy acceptance
   - Feature highlights
   - Legal agreements

## 💳 **Stripe Onboarding - Optional**

- **Can be skipped initially** - you can explore the app without completing Stripe setup
- **Test information only** - no real bank account or identity verification required
- **Accepts test data** for all fields during onboarding

## ⚠️ **Important Limitations**

Without completing Stripe onboarding, you **cannot**:

- Generate QR codes for payments
- Create payment links
- Process real transactions

## 🔄 **Restarting the Process**

To test different scenarios or start fresh:

1. **Click your avatar** (top right corner of main screen)
2. **Select "Password & Security"**
3. **Choose "Delete Account"** or logout to restart

## 🧪 **Key Features to Test**

### **✅ Always Available (No Stripe Required)**

- [ ] Biometric authentication with passcode fallback
- [ ] Navigation between screens (Home, Activity, Wallet)
- [ ] App settings and preferences
- [ ] Account management options

### **⚠️ Requires Stripe Onboarding**

- [ ] QR code generation for payments
- [ ] Payment link creation
- [ ] Transaction processing
- [ ] Bank account connection

## 📱 **Testing Scenarios**

### **Scenario 1: Full Experience**

1. Complete Stripe onboarding with test information
2. Test all payment features (QR codes, payment links)
3. Verify transaction history shows correctly

### **Scenario 2: Limited Experience**

1. Skip Stripe onboarding
2. Verify app navigation and basic features work
3. Confirm payment features show appropriate messages

### **Scenario 3: Account Management**

1. Test logout functionality
2. Test account deletion and recreation
3. Verify biometric settings persist/clear appropriately

## 🐛 **Bug Reporting**

If you encounter any issues:

1. Note the exact steps that led to the problem
2. Describe what you expected vs. what happened
3. Include screenshots if possible
4. Mention your device type and iOS version

## 📋 **Expected Behavior**

### **Test Account Button**

- Should immediately load demo user
- Navigate through full onboarding flow
- Show realistic demo data and transactions

### **Biometric Authentication**

- Face ID/Touch ID should work if available
- Passcode fallback should work for all devices
- Clear error messages if authentication fails

### **Stripe Integration**

- Mock data should work for all non-payment features
- Payment features should show helpful messages when unavailable
- Test Stripe onboarding should accept any reasonable test data

---

**Thank you for testing HandyPay! Your feedback helps us build a better payment experience.** 🙏

_Test Build Version: 1.0.0 (Build #4)_
