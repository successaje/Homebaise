// IPFS Utility Functions using Pinata
// This file provides Pinata integration for IPFS file uploads

export interface IPFSUploadResult {
  cid: string;
  size: number;
  path: string;
  name: string;
  url?: string;
}

export interface IPFSMetadata {
  name: string;
  description?: string;
  image?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Upload a file to IPFS using Pinata
 * @param file - The file to upload
 * @returns Promise with IPFS upload result
 */
export const uploadFileToIPFS = async (file: File): Promise<IPFSUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      cid: result.IpfsHash,
      size: file.size,
      path: `/ipfs/${result.IpfsHash}`,
      name: file.name,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    };
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};

/**
 * Upload multiple files to IPFS using Pinata
 * @param files - Array of files to upload
 * @param onProgress - Optional progress callback
 * @returns Promise with array of IPFS upload results
 */
export const uploadFilesToIPFS = async (
  files: File[], 
  onProgress?: (progress: number) => void
): Promise<IPFSUploadResult[]> => {
  const results: IPFSUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFileToIPFS(files[i]);
      results.push(result);
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error(`Error uploading file ${files[i].name}:`, error);
      throw error;
    }
  }
  
  return results;
};

/**
 * Upload metadata to IPFS using Pinata
 * @param metadata - The metadata object to upload
 * @param name - Name for the metadata
 * @returns Promise with IPFS upload result
 */
export const uploadMetadataToIPFS = async (
  metadata: IPFSMetadata, 
  name: string = 'metadata.json'
): Promise<IPFSUploadResult> => {
  const metadataFile = new File([JSON.stringify(metadata, null, 2)], name, {
    type: 'application/json'
  });
  
  return await uploadFileToIPFS(metadataFile);
};

/**
 * Get IPFS gateway URL for a CID
 * @param cid - The IPFS CID
 * @param gateway - Optional gateway URL (defaults to Pinata gateway)
 * @returns IPFS gateway URL
 */
export const getIPFSGatewayURL = (cid: string, gateway: string = 'https://gateway.pinata.cloud'): string => {
  return `${gateway}/ipfs/${cid}`;
};

/**
 * Validate IPFS CID format
 * @param cid - The CID to validate
 * @returns boolean indicating if CID is valid
 */
export const isValidCID = (cid: string): boolean => {
  // Basic CID validation (Qm... format for CIDv0)
  const cidRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  return cidRegex.test(cid);
};

/**
 * Pin a file to IPFS using Pinata
 * @param cid - The CID to pin
 * @returns Promise indicating success
 */
export const pinToIPFS = async (cid: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN}`
      },
      body: JSON.stringify({
        hashToPin: cid
      })
    });

    if (!response.ok) {
      throw new Error(`Pinata pinning failed: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error pinning to Pinata:', error);
    return false;
  }
};

/**
 * Get file info from Pinata
 * @param cid - The CID to get info for
 * @returns Promise with file information
 */
export const getIPFSFileInfo = async (cid: string): Promise<Record<string, unknown> | null> => {
  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/pinList?hashContains=${cid}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data?.[0] || null;
  } catch (error) {
    console.error('Error getting file info from Pinata:', error);
    return null;
  }
};

/**
 * Test Pinata connection
 * @returns Promise indicating if connection is successful
 */
export const testPinataConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
};

// Fallback mock implementation for development/testing
export const uploadFileToIPFSMock = async (file: File): Promise<IPFSUploadResult> => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock CID
  const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    cid: mockCid,
    size: file.size,
    path: `/ipfs/${mockCid}`,
    name: file.name,
    url: `https://gateway.pinata.cloud/ipfs/${mockCid}`
  };
};

// Export the appropriate function based on environment
export const uploadFileToIPFSFinal = process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN 
  ? uploadFileToIPFS 
  : uploadFileToIPFSMock;

/**
 * Upload a string to IPFS using Pinata
 * @param content - The string content to upload
 * @param filename - Optional filename (defaults to 'content.txt')
 * @returns Promise with IPFS upload result
 */
export const uploadToIPFS = async (content: string, filename: string = 'content.txt'): Promise<string> => {
  try {
    const file = new File([content], filename, { type: 'text/plain' });
    const result = await uploadFileToIPFSFinal(file);
    return `ipfs://${result.cid}/${filename}`;
  } catch (error) {
    console.error('Error uploading string to IPFS:', error);
    throw error;
  }
}; 