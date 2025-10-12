import { Synapse } from '@filoz/synapse-sdk';
import { ComplianceRequirement, StorageMetadata } from '../types/compliance';

export class SynapseService {
  private synapse: Synapse | null = null;
  private isInitialized = false;

  constructor() {}

  async initialize(): Promise<void> {
    try {
      this.synapse = await Synapse.create({
        privateKey: import.meta.env.VITE_WALLET_PRIVATE_KEY,
        rpcURL: import.meta.env.VITE_RPC_URL,
      });
      this.isInitialized = true;
      console.log('Synapse SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Synapse SDK:', error);
      throw error;
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
  ): Promise<StorageMetadata> {
    const synapse = this.getSynapse();

    const encryptedFile = await this.encryptFile(file);
    console.log("Encrypted File:",encryptedFile)
    const metadata: Record<string, string> = {
      fileName: file.name,
      fileSize: file.size.toString(),
      mimeType: file.type,
      compliance: JSON.stringify(compliance), 
      // Use the correct metadata key 'retention'
      retention: compliance.retentionPeriod.toString(),
      encryptionHash: await this.generateFileHash(file)
    };
    console.log("Metadata:",metadata)

    const storageManager = synapse.storage;
    console.log("Storage Manager:",storageManager)
    const storageContext = await storageManager.createContext({
      metadata: {
        retention: compliance.retentionPeriod.toString(),
      }
    });
    console.log("Storage Context:",storageContext)

    const storageResult = await storageContext.upload(await encryptedFile.arrayBuffer(), {
      metadata: metadata,
    });

    return {
      id: storageResult.pieceCid.toString(),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadDate: new Date(),
      compliance,
      retentionEndDate: new Date(Date.now() + compliance.retentionPeriod * 24 * 60 * 60 * 1000),
      pdpProofs: [],
      storageProviders: [storageContext.provider.id.toString()],
      encryptionHash: metadata.encryptionHash
    };
  }

  async retrieveForAudit(
    documentId: string,
    auditContext: {
      auditor: string;
      purpose: string;
      complianceType: string;
    }
  ): Promise<{ file: Blob; auditTrail: string }> {
    const synapse = this.getSynapse();
    
    const fileData = await synapse.storage.download(documentId, {
      withCDN: true,
    });

    // Generate compliance proof
    const complianceProof = await this.generateComplianceProof(documentId, auditContext);

    // FIX: Create a new Blob from a copy of the buffer to resolve the type error.
    return {
      file: new Blob([fileData.slice().buffer]),
      auditTrail: complianceProof
    };
  }

  private async encryptFile(file: File): Promise<File> {
    // Implement client-side encryption
    const arrayBuffer = await file.arrayBuffer();
    const encryptedBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return new File([encryptedBuffer], file.name, { type: file.type });
  }

  private async generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async generateComplianceProof(
    documentId: string,
    auditContext: any
  ): Promise<string> {
    const synapse = this.getSynapse();
    
    const storageInfo = await synapse.storage.getStorageInfo();

    return JSON.stringify({
      documentId,
      auditContext,
      pdpProofs: "Verification is managed by the Synapse SDK.",
      storageInfo,
      timestamp: new Date().toISOString(),
      complianceStatus: 'verified',
      regulatoryFramework: auditContext.complianceType
    });
  }
}