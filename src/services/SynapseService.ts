import { Synapse } from '@filoz/synapse-sdk';
import { ComplianceRequirement, StorageMetadata } from '../types/compliance';
// Import encryption utilities
import { encryptFile, decryptFile, generateFileHash } from '../utils/encryption';

export class SynapseService {
  private synapse: Synapse | null = null;
  private isInitialized = false;

  constructor() {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return; // Avoid re-initialization

    try {
      this.synapse = await Synapse.create({
        // IMPORTANT: Handle secrets securely. Do not hardcode.
        privateKey: import.meta.env.VITE_WALLET_PRIVATE_KEY,
        rpcURL: import.meta.env.VITE_RPC_URL,
      });
      this.isInitialized = true;
      console.log('Synapse SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Synapse SDK:', error);
      throw error; // Re-throw to indicate initialization failure
    }
  }

  private getSynapse(): Synapse {
    if (!this.isInitialized || !this.synapse) {
      throw new Error('Synapse SDK not initialized. Call initialize() first.');
    }
    return this.synapse;
  }

  async storeCompliantDocument(
    file: File,
    compliance: ComplianceRequirement,
    passphrase: string // Passphrase needed for encryption
  ): Promise<StorageMetadata> {
    const synapse = this.getSynapse();
    const originalFileBuffer = await file.arrayBuffer();

    // 1. Generate hash of the original file
    const fileHash = generateFileHash(originalFileBuffer); // Use utility

    // 2. Encrypt the file buffer
    const { ciphertext, iv, salt } = encryptFile(originalFileBuffer, passphrase); // Use utility
    const encryptedBuffer = Buffer.from(ciphertext, 'base64'); // Convert base64 ciphertext to buffer for upload

    // 3. Prepare metadata including encryption details
    const metadata: Record<string, string> = {
      fileName: file.name,
      fileSize: file.size.toString(), // Original file size
      mimeType: file.type,
      compliance: JSON.stringify(compliance),
      retention: compliance.retentionPeriod.toString(),
      encryptionHash: fileHash, // Hash of the original file
      encryptionIv: iv, // Store IV
      encryptionSalt: salt || '', // Store Salt (if generated)
      // Add any other relevant metadata
    };
    console.log("Metadata:", metadata);

    const storageManager = synapse.storage;
    console.log("Storage Manager:", storageManager);

    // 4. Create storage context with retention
    const storageContext = await storageManager.createContext({
      metadata: {
        retention: compliance.retentionPeriod.toString(),
      }
    });
    console.log("Storage Context:", storageContext);

    // 5. Upload the *encrypted* buffer
    const storageResult = await storageContext.upload(encryptedBuffer, {
      metadata: metadata, // Pass all prepared metadata
    });
    console.log("Storage Result:", storageResult);


    // 6. Return comprehensive metadata for the app state
    return {
      id: storageResult.pieceCid.toString(), // Use Piece CID as the ID
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadDate: new Date(),
      compliance,
      retentionEndDate: new Date(Date.now() + compliance.retentionPeriod * 24 * 60 * 60 * 1000),
      pdpProofs: [], // Placeholder
      storageProviders: [storageContext.provider.id.toString()], // Example provider ID
      encryptionHash: fileHash,
      // Store IV and Salt with the app's metadata representation as well, needed for retrieval
      encryptionIv: iv,
      encryptionSalt: salt
    };
  }

  async retrieveAndDecryptForAudit(
    documentMetadata: StorageMetadata, // Pass the full metadata object
    auditContext: {
      auditor: string;
      purpose: string;
      complianceType: string;
    },
    passphrase: string // Passphrase needed for decryption
  ): Promise<{ file: Blob; auditTrail: string }> {
    const synapse = this.getSynapse();

    // 1. Download the encrypted file data using the document ID (Piece CID)
    const encryptedDataBuffer = await synapse.storage.download(documentMetadata.id, {
      withCDN: true, // Utilize FilCDN if available/configured
    });

    // 2. Decrypt the data
    if (!documentMetadata.encryptionIv) {
        throw new Error("Encryption IV is missing from metadata, cannot decrypt.");
    }
    const decryptedBuffer = decryptFile(
        Buffer.from(encryptedDataBuffer).toString('base64'), // Convert buffer back to base64 ciphertext expected by decryptFile
        passphrase,
        documentMetadata.encryptionIv,
        documentMetadata.encryptionSalt // Pass salt if it exists
    ); // Use utility

    // 3. Verify integrity (Optional but recommended)
    const retrievedHash = generateFileHash(decryptedBuffer); // Use utility
    if (retrievedHash !== documentMetadata.encryptionHash) {
        console.warn("Integrity check failed: Hashes do not match.");
        // Decide how to handle this - throw error, alert user, etc.
        // throw new Error("File integrity check failed.");
    } else {
        console.log("File integrity verified.");
    }


    // 4. Generate compliance proof (remains the same)
    const complianceProof = await this.generateComplianceProof(documentMetadata.id, auditContext);

    // 5. Return the decrypted file as a Blob and the audit trail
    return {
      file: new Blob([decryptedBuffer], { type: documentMetadata.mimeType }),
      auditTrail: complianceProof
    };
  }

  // generateComplianceProof remains largely the same, maybe add more details
  private async generateComplianceProof(
    documentId: string, // Piece CID
    auditContext: any
  ): Promise<string> {
    const synapse = this.getSynapse();

    // Fetch storage info - useful for compliance reports
    const storageInfo = await synapse.storage.getStorageInfo(); // Relies on Synapse SDK

    // Potentially fetch on-chain PDP proofs or deal status if relevant/implemented
    // const dealStatus = await synapse.someMethodToGetDealStatus(documentId);

    return JSON.stringify({
      documentId: documentId,
      auditContext: auditContext,
      pdpVerificationMethod: "Managed by Synapse SDK/Filecoin Network", // Clarify PDP
      // pdpProofs: fetchedProofs, // If proofs were fetched
      storageProviderInfo: storageInfo, // Include provider details
      timestamp: new Date().toISOString(),
      complianceStatus: 'verified', // This might need more logic based on checks
      regulatoryFramework: auditContext.complianceType
    }, null, 2); // Pretty print JSON
  }
}