import { useState } from 'react';
import { ComplianceUploader } from './components/ComplianceUploader';
import { AuditDashboard } from './components/AuditDashboard';
import { StorageMetadata } from './types/compliance';
import './App.css';

function App() {
  const [storedDocuments, setStoredDocuments] = useState<StorageMetadata[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'audit'>('upload');

  const handleUploadComplete = (metadata: StorageMetadata) => {
    setStoredDocuments(prev => [...prev, metadata]);
    setActiveTab('audit');
    alert('Document stored with compliance features!');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>DataVault</h1>
          <p>Decentralized Compliance Storage Platform</p>
        </div>
        <nav className="nav-tabs">
          <button
            className={activeTab === 'upload' ? 'active' : ''}
            onClick={() => setActiveTab('upload')}
          >
            Upload Documents
          </button>
          <button
            className={activeTab === 'audit' ? 'active' : ''}
            onClick={() => setActiveTab('audit')}
          >
            Audit Dashboard ({storedDocuments.length})
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'upload' && (
          <div className="upload-section">
            <ComplianceUploader onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-section">
            <AuditDashboard documents={storedDocuments} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>Powered by Filecoin Onchain Cloud</span>
          <div className="tech-stack">
            <span>Synapse SDK</span>
            <span>Warm Storage</span>
            <span>Filecoin Pay</span>
            <span>FilCDN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;