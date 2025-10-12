import CryptoJS from 'crypto-js';

/**
 * Encrypts a file buffer using AES encryption for client-side security
 * @param {ArrayBuffer} fileBuffer - The raw file data as an ArrayBuffer
 * @param {string} passphrase - A secure passphrase for encryption
 * @returns {Object} Encrypted data and initialization vector
 */
export const encryptFile = (fileBuffer: any, passphrase: any) => {
  // Convert ArrayBuffer to WordArray for CryptoJS
  const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
  
  // Encrypt
  const encrypted = CryptoJS.AES.encrypt(wordArray, passphrase);
  
  // Return data needed for decryption
  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: encrypted.iv.toString(),
    salt: encrypted.salt?.toString()
  };
};

/**
 * Generates a SHA-256 hash of the file for integrity verification
 * @param {ArrayBuffer} fileBuffer 
 * @returns {string} Hexadecimal hash string
 */
export const generateFileHash = (fileBuffer: any) => {
  const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
  const hash = CryptoJS.SHA256(wordArray);
  return hash.toString(CryptoJS.enc.Hex);
};