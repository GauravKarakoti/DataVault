import { useState, useEffect } from 'react';
import { Synapse } from '@filoz/synapse-sdk';

// A placeholder for your compliance config type
interface ComplianceConfig {
  regulation: 'HIPAA' | 'GDPR';
  retentionPeriod: number; // in days
}

export const useSynapseStorage = () => {
  // Correctly type the state to hold either a Synapse instance or null
  const [synapse, setSynapse] = useState<Synapse | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize the Synapse SDK
  useEffect(() => {
    const initSynapse = async () => {
      setIsInitializing(true);
      try {
        // Use the static `create` method for initialization
        const sdk = await Synapse.create({
          // You must provide authentication, like a private key and RPC URL
          // It's best to use environment variables for these
          privateKey: import.meta.env.VITE_WALLET_PRIVATE_KEY,
        rpcURL: import.meta.env.VITE_RPC_URL,
        });
        setSynapse(sdk);
      } catch (error) {
        console.error('Failed to initialize Synapse SDK:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initSynapse();
  }, []); // The empty dependency array ensures this runs only once

  const storeWithCompliance = async (file: File, complianceConfig: ComplianceConfig) => {
    if (!synapse) {
      throw new Error('Synapse SDK not initialized or is still initializing.');
    }

    // 1. Prepare metadata
    // The SDK expects all metadata values to be strings.
    const storageMetadata: Record<string, string> = {
      regulation: complianceConfig.regulation,
      retentionPeriod: complianceConfig.retentionPeriod.toString(),
      fileName: file.name,
      fileSize: file.size.toString(),
      uploadDate: new Date().toISOString(),
    };

    // 2. Use the `storage` manager to create a context
    const storageContext = await synapse.storage.createContext();

    // 3. Upload the file using the context
    // The upload method expects an ArrayBuffer
    const storageResult = await storageContext.upload(await file.arrayBuffer(), {
      metadata: storageMetadata,
    });

    console.log('File stored successfully:', storageResult);
    return storageResult;
  };

  return {
    storeWithCompliance,
    isInitializing,
    isReady: !!synapse,
  };
};