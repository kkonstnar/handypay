# HandyPay - Mobile Payment Solution

A comprehensive mobile payment platform built with React Native and Expo, featuring secure authentication, Stripe integration, and cross-platform compatibility.

## 📁 Project Structure

```
phonetap-mobile/
├── docs/                          # Documentation
│   ├── PRODUCTION_READINESS_TESTS.md
│   └── TEST_SCRIPT_README.md
├── tests/                         # Automated test suite
│   ├── test-production-readiness.js
│   └── test-results.json          # Generated test results
├── handypay-backend/              # Backend API server
│   ├── src/
│   │   ├── routes/               # API route handlers
│   │   ├── services/             # Business logic services
│   │   ├── utils/                # Utility functions
│   │   └── controllers/          # Request/response handlers
│   ├── package.json
│   └── README.md
├── src/                          # React Native app source
│   ├── components/               # Reusable UI components
│   ├── screens/                  # App screens
│   ├── services/                 # App services (auth, API)
│   ├── contexts/                 # React contexts
│   └── navigation/               # Navigation configuration
├── assets/                       # Static assets (images, fonts)
├── ios/                          # iOS native code
└── android/                      # Android native code (generated)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- PostgreSQL database
- Stripe account (for payments)

### Backend Setup

```bash
cd handypay-backend
npm install
cp env-template.txt .env
# Edit .env with your configuration
npm run dev
```

### Mobile App Setup

```bash
npm install
npx expo start
```

## 🧪 Testing

### Automated Testing

Run the comprehensive production readiness test suite:

```bash
cd handypay-backend
npm run test:local
```

### Test Environments

```bash
# Local development
npm run test:local

# Staging environment
npm run test:staging

# Production (use with caution)
npm run test:prod
```

### Manual Testing Checklist

See `docs/PRODUCTION_READINESS_TESTS.md` for complete testing requirements.

## 📚 Documentation

- **[Production Readiness Tests](docs/PRODUCTION_READINESS_TESTS.md)** - Comprehensive testing checklist
- **[Test Script Guide](docs/TEST_SCRIPT_README.md)** - Automated testing documentation
- **[Backend README](handypay-backend/README.md)** - Backend-specific documentation

## 🔧 Development Scripts

### Backend

```bash
cd handypay-backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run test:local   # Run automated tests
```

### Mobile App

```bash
npm start            # Start Expo development server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run web          # Run in web browser
```

## 🔐 Security Features

- **Authentication**: Apple Sign-In and Google OAuth
- **Authorization**: User-specific data access controls
- **Input Validation**: SQL injection and XSS prevention
- **Rate Limiting**: API request throttling
- **Security Headers**: Comprehensive security headers
- **Data Encryption**: Secure data transmission

## 💳 Payment Integration

- **Stripe Connect**: Secure payment processing
- **Payment Links**: Generate shareable payment links
- **Transaction History**: Complete transaction tracking
- **Payout Management**: Automated payout processing
- **Multi-currency**: Support for JMD and USD

## 📱 Supported Platforms

- **iOS**: 15.0+
- **Android**: 11.0+
- **Web**: Modern browsers with React Native Web

## 🚀 Deployment

### Backend

```bash
cd handypay-backend
npm run build
npm run start
```

### Mobile App

```bash
npx expo build:ios
npx expo build:android
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in both root and `handypay-backend/` directories:

```bash
# Backend
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mobile App
EXPO_PUBLIC_API_URL=https://your-api.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm run test:local`
4. Ensure all tests pass
5. Submit a pull request

## 📋 Testing Checklist

Before deploying to production, ensure:

- [ ] All automated tests pass (`npm run test:local`)
- [ ] Manual testing checklist completed
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Cross-platform compatibility verified

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: See `docs/` folder
- **Testing**: Run `npm run test:local` for automated tests

## 📄 License

This project is proprietary software for HandyPay.

---

**Built with ❤️ using React Native, Expo, and modern web technologies.**
