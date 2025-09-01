const { makeRedirectUri } = require('expo-auth-session');

// Simulate the same configuration as the app
const GOOGLE_REDIRECT_URI = makeRedirectUri({
  useProxy: true, // In development mode
  scheme: "handypay",
});

console.log("🔗 Google Redirect URI being used:", GOOGLE_REDIRECT_URI);
console.log("🔗 Is development mode:", true);
console.log("🔗 Scheme:", "handypay");
console.log("🔗 Use proxy:", true);