import CryptoJS from 'crypto-js';

/**
 * Encrypts a file buffer using AES encryption.
 * @param {ArrayBuffer} fileBuffer - The raw file data.
 * @param {string} passphrase - Secure passphrase.
 * @returns {Object} Containing ciphertext (Base64), iv (string), salt (string).
 */
export const encryptFile = (fileBuffer: ArrayBuffer, passphrase: string) => {
  const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, passphrase);

  // Ensure salt is handled, generate if not present (CryptoJS might do this automatically)
  const salt = encrypted.salt ? encrypted.salt.toString() : CryptoJS.lib.WordArray.random(128 / 8).toString();

  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: encrypted.iv.toString(),
    salt: salt // Include salt explicitly if needed
  };
};

/**
 * Decrypts AES encrypted data.
 * @param {string} ciphertextBase64 - Base64 encoded ciphertext.
 * @param {string} passphrase - The passphrase used for encryption.
 * @param {string} ivString - The initialization vector string.
 * @param {string} [saltString] - Optional salt string used during encryption.
 * @returns {ArrayBuffer} The decrypted file data.
 */
export const decryptFile = (ciphertextBase64: string, passphrase: string, ivString: string, saltString?: string): ArrayBuffer => {
  const ciphertext = CryptoJS.enc.Base64.parse(ciphertextBase64);
  const iv = CryptoJS.enc.Hex.parse(ivString); // Assuming IV was stored/retrieved as hex string
  const salt = saltString ? CryptoJS.enc.Hex.parse(saltString) : undefined; // Assuming salt was stored/retrieved as hex string

  // Construct the CipherParams object
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: ciphertext,
    iv: iv,
    salt: salt
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, passphrase);
  const typedArray = convertWordArrayToUint8Array(decrypted);
  return typedArray.buffer;
};


/**
 * Generates a SHA-256 hash of the file buffer.
 * @param {ArrayBuffer} fileBuffer
 * @returns {string} Hexadecimal hash string.
 */
export const generateFileHash = (fileBuffer: ArrayBuffer): string => {
  const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
  const hash = CryptoJS.SHA256(wordArray);
  return hash.toString(CryptoJS.enc.Hex);
};

// Helper function to convert CryptoJS WordArray to Uint8Array/ArrayBuffer
function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const l = wordArray.sigBytes;
  const words = wordArray.words;
  const result = new Uint8Array(l);
  var i=0 /*dst*/, j=0 /*src*/;
  while(true) {
      // here i is a multiple of 4
      if (i==l)
          break;
      var w = words[j++];
      result[i++] = (w & 0xff000000) >>> 24;
      if (i==l)
          break;
      result[i++] = (w & 0x00ff0000) >>> 16;
      if (i==l)
          break;
      result[i++] = (w & 0x0000ff00) >>> 8;
      if (i==l)
          break;
      result[i++] = (w & 0x000000ff);
  }
  return result;
}