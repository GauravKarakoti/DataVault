import React, { useState, useCallback } from 'react';
import { Upload, Shield, FileCheck } from 'lucide-react';
import { SynapseService } from '../services/SynapseService';
import { ComplianceRequirement, StorageMetadata } from '../types/compliance';

interface ComplianceUploaderProps {
  onUploadComplete: (metadata: StorageMetadata) => void;
}

export const ComplianceUploader: React.FC<ComplianceUploaderProps> = ({ 
  onUploadComplete 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [complianceType, setComplianceType] = useState<ComplianceRequirement['regulation']>('HIPAA');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const synapseService = new SynapseService();
      await synapseService.initialize();

      const complianceReq: ComplianceRequirement = {
        regulation: complianceType,
        retentionPeriod: complianceType === 'HIPAA' ? 2555 : 3650, // 7 years for HIPAA, 10 for others
        accessLogging: true,
        encryptionRequired: true,
        auditTrailRequired: true
      };

      const metadata = await synapseService.storeCompliantDocument(
        selectedFile,
        complianceReq
      );

      onUploadComplete(metadata);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="compliance-uploader">
      <div className="upload-header">
        <Shield className="icon" />
        <h3>Compliant Document Upload</h3>
      </div>

      <div className="compliance-selector">
        <label>Regulatory Framework:</label>
        <select 
          value={complianceType} 
          onChange={(e) => setComplianceType(e.target.value as any)}
        >
          <option value="HIPAA">HIPAA (Healthcare)</option>
          <option value="GDPR">GDPR (EU Data Protection)</option>
          <option value="SOX">SOX (Financial Reporting)</option>
          <option value="SEC">SEC (Securities)</option>
          <option value="FINRA">FINRA (Financial Industry)</option>
        </select>
      </div>

      <div className="file-selector">
        <input
          type="file"
          id="file-upload"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <label htmlFor="file-upload" className="file-label">
          <Upload className="icon" />
          {selectedFile ? selectedFile.name : 'Choose Document'}
        </label>
      </div>

      {selectedFile && (
        <div className="compliance-features">
          <div className="feature">
            <FileCheck className="icon" />
            <span>End-to-End Encryption</span>
          </div>
          <div className="feature">
            <FileCheck className="icon" />
            <span>Automated Audit Trail</span>
          </div>
          <div className="feature">
            <FileCheck className="icon" />
            <span>Continuous PDP Verification</span>
          </div>
          <div className="feature">
            <FileCheck className="icon" />
            <span>{complianceType} Compliance Ready</span>
          </div>
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="upload-button"
      >
        {isUploading ? 'Uploading with Compliance...' : 'Store Compliant Document'}
      </button>
    </div>
  );
};