import React, { useState } from 'react';
import { Search, Download, Shield, FileText } from 'lucide-react';
import { StorageMetadata, AuditTrail } from '../types/compliance';
import { SynapseService } from '../services/SynapseService';

interface AuditDashboardProps {
  documents: StorageMetadata[];
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({ documents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<StorageMetadata | null>(null);
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(false);

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.compliance.regulation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAuditRetrieval = async (doc: StorageMetadata) => {
    setIsRetrieving(true);
    try {
        const synapseService = new SynapseService();
        await synapseService.initialize();

        const auditContext = {
        auditor: 'compliance-officer',
        purpose: 'regulatory-audit',
        // Use 'doc' here
        complianceType: doc.compliance.regulation
        };

        // Use 'doc' here
        const result = await synapseService.retrieveForAudit(doc.id, auditContext);

        // This 'document' now correctly refers to the global DOM object
        const a = document.createElement('a');
        const url = URL.createObjectURL(result.file);
        a.href = url;
        // Use 'doc' here
        a.download = `audit_${doc.fileName}`;
        a.click();
        URL.revokeObjectURL(url);

        const auditTrail: AuditTrail = {
        id: crypto.randomUUID(),
        // Use 'doc' here
        documentId: doc.id,
        action: 'AUDIT_ACCESS',
        timestamp: new Date(),
        user: auditContext.auditor,
        userRole: 'compliance-auditor',
        complianceProof: result.auditTrail
        };

        setAuditTrails(prev => [...prev, auditTrail]);
        // Use 'doc' here
        setSelectedDocument(doc);

    } catch (error) {
        console.error('Audit retrieval failed:', error);
        alert('Failed to retrieve document for audit');
    } finally {
        setIsRetrieving(false);
    }
    };

  return (
    <div className="audit-dashboard">
      <div className="dashboard-header">
        <Shield className="icon" />
        <h2>Compliance Audit Dashboard</h2>
      </div>

      <div className="search-section">
        <div className="search-input">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search documents by name or regulation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="documents-grid">
        {/* Change the map variable from 'document' to 'doc' */}
        {filteredDocuments.map(doc => (
            <div key={doc.id} className="document-card">
            <FileText className="document-icon" />
            <div className="document-info">
                <h4>{doc.fileName}</h4>
                <p className="compliance-badge">{doc.compliance.regulation}</p>
                <p className="file-size">{Math.round(doc.fileSize / 1024)} KB</p>
                <p className="retention">
                Retention: {new Date(doc.retentionEndDate).toLocaleDateString()}
                </p>
            </div>
            <button
                // Pass 'doc' to the handler
                onClick={() => handleAuditRetrieval(doc)}
                disabled={isRetrieving}
                className="audit-button"
            >
                <Download className="icon" />
                {isRetrieving ? 'Retrieving...' : 'Audit Access'}
            </button>
            </div>
        ))}
        </div>

      {selectedDocument && (
        <div className="audit-trail-section">
          <h3>Recent Audit Activity</h3>
          <div className="audit-trails">
            {auditTrails.map(trail => (
              <div key={trail.id} className="audit-trail">
                <span className="action">{trail.action}</span>
                <span className="user">{trail.user}</span>
                <span className="timestamp">
                  {trail.timestamp.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};