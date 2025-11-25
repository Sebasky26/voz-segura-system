// Archivo: src/lib/encryption.ts
// Descripción: Funciones para cifrado/descifrado de datos sensibles
// Usa AES-256-GCM para cifrado simétrico seguro

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

// Clave de cifrado (en producción debe estar en variable de entorno)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32bytes!!';

/**
 * Genera una clave de cifrado derivada usando PBKDF2
 */
function getKey(): Buffer {
  const salt = Buffer.from(SALT_LENGTH.toString().padStart(SALT_LENGTH, '0'));
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
}

/**
 * Cifra un texto usando AES-256-GCM
 * @param text - Texto a cifrar
 * @returns Texto cifrado en formato: iv:authTag:encryptedData (base64)
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Retornar: iv:authTag:encryptedData
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Error al cifrar:', error);
    return null;
  }
}

/**
 * Descifra un texto cifrado con AES-256-GCM
 * @param encryptedText - Texto cifrado en formato: iv:authTag:encryptedData
 * @returns Texto descifrado o null si falla
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      console.error('Formato de texto cifrado inválido');
      return null;
    }
    
    const [ivBase64, authTagBase64, encrypted] = parts;
    const key = getKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error al descifrar:', error);
    return null;
  }
}

/**
 * Cifra múltiples campos de un objeto
 * @param data - Objeto con datos a cifrar
 * @param fields - Array de nombres de campos a cifrar
 * @returns Objeto con campos cifrados
 */
export function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T {
  const encrypted = { ...data };
  
  for (const field of fields) {
    if (typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field] as string) as T[typeof field];
    }
  }
  
  return encrypted;
}

/**
 * Descifra múltiples campos de un objeto
 * @param data - Objeto con datos cifrados
 * @param fields - Array de nombres de campos a descifrar
 * @returns Objeto con campos descifrados
 */
export function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): T {
  const decrypted = { ...data };
  
  for (const field of fields) {
    if (typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field] as string) as T[typeof field];
    }
  }
  
  return decrypted;
}

/**
 * Oculta parcialmente un texto (para mostrar sin revelar todo)
 * Ej: "Juan Pérez" => "J*** P****"
 */
export function maskText(text: string | null | undefined): string {
  if (!text) return '***';
  
  const words = text.split(' ');
  return words
    .map(word => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(word.length - 1);
    })
    .join(' ');
}
