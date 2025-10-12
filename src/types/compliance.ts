export interface ComplianceRequirement {
  regulation: 'HIPAA' | 'GDPR' | 'SOX' | 'SEC' | 'FINRA';
  retentionPeriod: number; // in days
  accessLogging: boolean;
  encryptionRequired: boolean;
  auditTrailRequired: boolean;
}

export interface AuditTrail {
  id: string;
  documentId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'AUDIT_ACCESS';
  timestamp: Date;
  user: string;
  userRole: string;
  ipAddress?: string;
  complianceProof?: string;
}

export interface StorageMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  compliance: ComplianceRequirement;
  retentionEndDate: Date;
  pdpProofs: string[];
  storageProviders: string[];
  encryptionHash: string;
}