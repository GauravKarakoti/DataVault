// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ComplianceStorage {
    struct Document {
        string documentId;
        address owner;
        string complianceType;
        uint256 uploadTime;
        uint256 retentionPeriod;
        string encryptionHash;
        string[] pdpProofs;
        address[] storageProviders;
        bool isActive;
    }

    struct AuditTrail {
        string documentId;
        address auditor;
        string action;
        uint256 timestamp;
        string complianceProof;
    }

    mapping(string => Document) private documents;
    mapping(string => AuditTrail[]) private auditTrails;
    
    event DocumentStored(
        string indexed documentId,
        address indexed owner,
        string complianceType,
        uint256 retentionPeriod
    );
    
    event AuditAccess(
        string indexed documentId,
        address indexed auditor,
        string action,
        string complianceProof
    );

    function storeDocument(
        string memory _documentId,
        string memory _complianceType,
        uint256 _retentionPeriod,
        string memory _encryptionHash,
        address[] memory _storageProviders
    ) external {
        require(bytes(_documentId).length > 0, "Document ID required");
        require(_retentionPeriod > 0, "Retention period required");
        
        documents[_documentId] = Document({
            documentId: _documentId,
            owner: msg.sender,
            complianceType: _complianceType,
            uploadTime: block.timestamp,
            retentionPeriod: _retentionPeriod,
            encryptionHash: _encryptionHash,
            pdpProofs: new string[](0),
            storageProviders: _storageProviders,
            isActive: true
        });
        
        emit DocumentStored(
            _documentId,
            msg.sender,
            _complianceType,
            _retentionPeriod
        );
    }

    function logAuditAccess(
        string memory _documentId,
        string memory _action,
        string memory _complianceProof
    ) external {
        Document storage doc = documents[_documentId];
        require(doc.isActive, "Document not found or inactive");
        
        auditTrails[_documentId].push(AuditTrail({
            documentId: _documentId,
            auditor: msg.sender,
            action: _action,
            timestamp: block.timestamp,
            complianceProof: _complianceProof
        }));
        
        emit AuditAccess(_documentId, msg.sender, _action, _complianceProof);
    }

    function addPDPProof(string memory _documentId, string memory _proof) external {
        Document storage doc = documents[_documentId];
        require(doc.isActive, "Document not found or inactive");
        require(doc.owner == msg.sender, "Only document owner can add proofs");
        
        doc.pdpProofs.push(_proof);
    }

    function getDocument(string memory _documentId) external view returns (
        address owner,
        string memory complianceType,
        uint256 uploadTime,
        uint256 retentionPeriod,
        string memory encryptionHash,
        string[] memory pdpProofs,
        address[] memory storageProviders,
        bool isActive
    ) {
        Document storage doc = documents[_documentId];
        return (
            doc.owner,
            doc.complianceType,
            doc.uploadTime,
            doc.retentionPeriod,
            doc.encryptionHash,
            doc.pdpProofs,
            doc.storageProviders,
            doc.isActive
        );
    }

    function getAuditTrails(string memory _documentId) external view returns (AuditTrail[] memory) {
        return auditTrails[_documentId];
    }
}