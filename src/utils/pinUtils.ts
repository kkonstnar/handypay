import * as Crypto from 'expo-crypto';

/**
 * PIN Utility Functions
 * Handles encoding and decoding of Safety PINs for secure storage
 */

/**
 * Hash a PIN for secure storage in database
 * Uses SHA256 with a salt for security
 */
export const hashPin = async (pin: string): Promise<string> => {
  try {
    // Add a salt to make the hash more secure
    const salt = 'HandyPaySecuritySalt2024';
    const pinWithSalt = pin + salt;
    
    // Hash using SHA256
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pinWithSalt,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    return hash;
  } catch (error) {
    console.error('Error hashing PIN:', error);
    throw new Error('Failed to hash PIN');
  }
};

/**
 * Verify a PIN against its stored hash
 */
export const verifyPin = async (pin: string, storedHash: string): Promise<boolean> => {
  try {
    const hashedInput = await hashPin(pin);
    return hashedInput === storedHash;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

/**
 * Validate PIN format (should be 4-6 digits)
 */
export const validatePinFormat = (pin: string): boolean => {
  // Check if PIN is 4-6 digits only
  const pinRegex = /^\d{4,6}$/;
  return pinRegex.test(pin);
};