import React, { useState, useCallback, useRef } from 'react';
import { Upload, Shield, FileCheck, LockIcon } from 'lucide-react'; // Added LockIcon
import { SynapseService } from '../services/SynapseService';
import { ComplianceRequirement, StorageMetadata } from '../types/compliance';

interface ComplianceUploaderProps {
  onUploadComplete: (metadata: StorageMetadata) => void;
}

// Instantiate the service outside the component to maintain its state
const synapseService = new SynapseService();

export const ComplianceUploader: React.FC<ComplianceUploaderProps> = ({
  onUploadComplete
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [complianceType, setComplianceType] = useState<ComplianceRequirement['regulation']>('HIPAA');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState(''); // State for passphrase
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !passphrase) {
        alert('Please select a file and enter an encryption passphrase.');
        return;
    }

    setIsUploading(true);
    try {
      // Initialize if not already done (safe to call multiple times)
      await synapseService.initialize();
      console.log("Synapse Initialized");

      const complianceReq: ComplianceRequirement = {
        regulation: complianceType,
        // Example: Adjust retention based on regulation
        retentionPeriod: complianceType === 'HIPAA' ? 2555 : (complianceType === 'GDPR' ? 1825 : 3650), // 7y HIPAA, 5y GDPR, 10y others
        accessLogging: true, // Assuming these are always true for this app
        encryptionRequired: true,
        auditTrailRequired: true
      };
      console.log("Compliance:", complianceReq);

      const metadata = await synapseService.storeCompliantDocument(
        selectedFile,
        complianceReq,
        passphrase // Pass the passphrase
      );
      console.log("Metadata:", metadata);

      onUploadComplete(metadata);
      // Clear state after successful upload
      setSelectedFile(null);
      setPassphrase('');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }

    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
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

      {/* Compliance Type Selector */}
      <div className="compliance-selector">
        <label htmlFor="compliance-select">Regulatory Framework:</label>
        <select
          id="compliance-select"
          value={complianceType}
          onChange={(e) => setComplianceType(e.target.value as ComplianceRequirement['regulation'])}
          disabled={isUploading}
        >
          <option value="HIPAA">HIPAA (Healthcare)</option>
          <option value="GDPR">GDPR (EU Data Protection)</option>
          <option value="SOX">SOX (Financial Reporting)</option>
          <option value="SEC">SEC (Securities)</option>
          <option value="FINRA">FINRA (Financial Industry)</option>
        </select>
      </div>

      {/* File Selector */}
      <div className="file-selector">
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef} // Assign ref
          onChange={handleFileSelect}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload" className="file-label">
          <Upload className="icon" />
          {selectedFile ? selectedFile.name : 'Choose Document to Encrypt & Store'}
        </label>
      </div>

      {/* Passphrase Input */}
      {selectedFile && (
        <div className="passphrase-section" style={{ marginTop: '1.5rem' }}>
           <label htmlFor="passphrase-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151'}}>
             <LockIcon className="icon" style={{ verticalAlign: 'middle', marginRight: '0.25rem'}}/> Encryption Passphrase:
           </label>
           <input
             id="passphrase-input"
             type="password"
             value={passphrase}
             onChange={(e) => setPassphrase(e.target.value)}
             placeholder="Enter a secure passphrase"
             disabled={isUploading}
             style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem'}}
           />
           <small style={{display: 'block', marginTop: '0.25rem', color: '#6b7280'}}>Needed to encrypt the file before upload and required for later retrieval.</small>
        </div>
      )}


      {/* Compliance Features Display */}
      {selectedFile && (
        <div className="compliance-features">
          <div className="feature"><FileCheck className="icon" /><span>Client-Side AES Encryption</span></div>
          <div className="feature"><FileCheck className="icon" /><span>SHA-256 Integrity Hash</span></div>
          <div className="feature"><FileCheck className="icon" /><span>Decentralized Storage via Synapse</span></div>
          <div className="feature"><FileCheck className="icon" /><span>{complianceType} Metadata & Retention</span></div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !passphrase || isUploading}
        className="upload-button"
      >
        {isUploading ? 'Encrypting & Storing...' : 'Store Compliant Document'}
      </button>
    </div>
  );
};