import React, { useState } from 'react';
import { Download, Shield, FileText, LockIcon, UnlockIcon } from 'lucide-react'; // Added icons
import { StorageMetadata, AuditTrail } from '../types/compliance';
import { SynapseService } from '../services/SynapseService';

interface AuditDashboardProps {
  documents: StorageMetadata[];
}

// Instantiate the service outside the component
const synapseService = new SynapseService();

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<StorageMetadata | null>(null);
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [decryptionPassphrase, setDecryptionPassphrase] = useState(''); // State for decryption passphrase
  const [showPassphraseInput, setShowPassphraseInput] = useState<string | null>(null); // Store ID of doc needing passphrase

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.compliance.regulation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to request passphrase input
  const requestPassphrase = (docId: string) => {
    setShowPassphraseInput(docId);
    setSelectedDocument(documents.find(d => d.id === docId) || null); // Keep track of the selected doc
  };

  // Function to handle the actual retrieval and decryption
  const handleAuditRetrievalAndDecryption = async () => {
    if (!selectedDocument || !decryptionPassphrase) {
        alert("Passphrase is required to decrypt and download.");
        return;
    }

    setIsRetrieving(true);
    setShowPassphraseInput(null); // Hide input after submission

    try {
        // Initialize service if needed
        await synapseService.initialize();

        const auditContext = {
            auditor: 'compliance-officer', // Example auditor
            purpose: 'regulatory-audit',
            complianceType: selectedDocument.compliance.regulation
        };

        // Call the updated service method
        const result = await synapseService.retrieveAndDecryptForAudit(
            selectedDocument,
            auditContext,
            decryptionPassphrase
        );

        // Trigger download
        const a = document.createElement('a');
        const url = URL.createObjectURL(result.file);
        a.href = url;
        a.download = `audit_decrypted_${selectedDocument.fileName}`; // Indicate decrypted file
        document.body.appendChild(a); // Append to body to ensure visibility in all browsers
        a.click();
        document.body.removeChild(a); // Clean up
        URL.revokeObjectURL(url);

        // Record audit trail
        const auditTrail: AuditTrail = {
            id: crypto.randomUUID(),
            documentId: selectedDocument.id,
            action: 'AUDIT_ACCESS',
            timestamp: new Date(),
            user: auditContext.auditor,
            userRole: 'compliance-auditor',
            complianceProof: result.auditTrail // Store the generated proof
        };
        setAuditTrails(prev => [auditTrail, ...prev]); // Add to the top

    } catch (error) {
        console.error('Audit retrieval/decryption failed:', error);
        alert(`Failed to retrieve or decrypt document: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsRetrieving(false);
        setDecryptionPassphrase(''); // Clear passphrase
        setSelectedDocument(null); // Reset selected document after operation
    }
  };


  return (
    <div className="audit-dashboard">
      <div className="dashboard-header">
        <Shield className="icon" />
        <h2>Compliance Audit Dashboard</h2>
      </div>

      {/* Search Section */}
      <div className="search-section">
        {/* ... search input ... */}
      </div>

      {/* Documents Grid */}
      <div className="documents-grid">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="document-card">
            <FileText className="document-icon" />
            <div className="document-info">
              <h4>{doc.fileName}</h4>
              <p className="compliance-badge">{doc.compliance.regulation}</p>
              <p className="file-size">{Math.round(doc.fileSize / 1024)} KB</p>
              <p className="retention">
                Retains Until: {new Date(doc.retentionEndDate).toLocaleDateString()}
              </p>
              {/* Show passphrase input inline if this doc is selected */}
              {showPassphraseInput === doc.id && (
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid #eee', paddingTop: '0.75rem'}}>
                  <label htmlFor={`passphrase-${doc.id}`} style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem'}}>
                    <LockIcon size={14} style={{ verticalAlign: 'middle', marginRight: '4px'}}/> Enter Passphrase to Decrypt:
                  </label>
                  <input
                    id={`passphrase-${doc.id}`}
                    type="password"
                    value={decryptionPassphrase}
                    onChange={(e) => setDecryptionPassphrase(e.target.value)}
                    placeholder="Required for download"
                    disabled={isRetrieving}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '0.5rem'}}
                  />
                  <button
                    onClick={handleAuditRetrievalAndDecryption}
                    disabled={isRetrieving || !decryptionPassphrase}
                    className="audit-button"
                    style={{ background: '#10B981', fontSize: '0.8rem', padding: '0.5rem 0.75rem'}}
                  >
                     <UnlockIcon size={14} style={{ marginRight: '4px'}}/> Decrypt & Download
                  </button>
                   <button
                    onClick={() => { setShowPassphraseInput(null); setDecryptionPassphrase(''); }}
                    disabled={isRetrieving}
                    style={{ background: '#ef4444', color:'white', fontSize: '0.8rem', padding: '0.5rem 0.75rem', marginLeft: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                     Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Audit Access Button - now just triggers passphrase input */}
            {showPassphraseInput !== doc.id && (
              <button
                onClick={() => requestPassphrase(doc.id)}
                disabled={isRetrieving}
                className="audit-button"
              >
                <Download className="icon" />
                Audit Access
              </button>
            )}
          </div>
        ))}
        {filteredDocuments.length === 0 && <p>No documents found matching your search.</p>}
      </div>

      {/* Audit Trail Section (display relevant trails) */}
      <div className="audit-trail-section">
          <h3>Recent Audit Activity</h3>
          <div className="audit-trails">
            {auditTrails.length > 0 ? auditTrails.map(trail => (
              <div key={trail.id} className="audit-trail">
                <span className="action">{trail.action}</span>
                {/* Find document name based on trail.documentId */}
                <span className="doc-name">({documents.find(d => d.id === trail.documentId)?.fileName || 'Unknown Document'})</span>
                <span className="user">by {trail.user}</span>
                <span className="timestamp">
                  {trail.timestamp.toLocaleString()}
                </span>
                {/* Optionally add a way to view the complianceProof JSON */}
                {/* <button onClick={() => alert(trail.complianceProof)}>View Proof</button> */}
              </div>
            )) : <p>No audit activity recorded yet.</p>}
          </div>
        </div>
    </div>
  );
};