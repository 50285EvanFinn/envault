import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const ITERATIONS = 100_000;
const DIGEST = 'sha256';

export interface EncryptedPayload {
  salt: string;
  iv: string;
  tag: string;
  data: string;
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

export function encrypt(plaintext: string, password: string): EncryptedPayload {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

export function decrypt(payload: EncryptedPayload, password: string): string {
  const salt = Buffer.from(payload.salt, 'hex');
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const data = Buffer.from(payload.data, 'hex');

  if (tag.length !== TAG_LENGTH) {
    throw new Error('Invalid authentication tag length');
  }

  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed: invalid password or corrupted data');
  }
}
