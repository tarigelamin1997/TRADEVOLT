import crypto from 'crypto';

// Encryption utilities for secure password storage
// Uses AES-256-GCM encryption

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16;  // 128 bits
const IV_LENGTH = 16;   // 128 bits
const KEY_LENGTH = 32;  // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

// Get encryption key from environment or generate one
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return key;
}

// Derive key from password using PBKDF2
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

// Encrypt sensitive data
export function encrypt(text: string): string {
  try {
    const password = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from password
    const key = deriveKey(password, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // Get auth tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    // Return base64 encoded string
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt sensitive data
export function decrypt(encryptedData: string): string {
  try {
    const password = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from password
    const key = deriveKey(password, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Generate a secure encryption key (run once during setup)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash data for comparison (e.g., API tokens)
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

// Validate encrypted data format
export function isValidEncryptedFormat(data: string): boolean {
  try {
    const decoded = Buffer.from(data, 'base64');
    const minLength = SALT_LENGTH + IV_LENGTH + TAG_LENGTH + 1; // At least 1 byte of encrypted data
    return decoded.length >= minLength;
  } catch {
    return false;
  }
}