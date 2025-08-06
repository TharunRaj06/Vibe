const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class AzureBlobStorage {
  constructor() {
    this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'claim-images';
    
    if (!this.connectionString) {
      console.warn('Azure Storage connection string not found. File uploads will be stored locally.');
      return;
    }
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    
    // Ensure container exists
    this.ensureContainer();
  }

  async ensureContainer() {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob'
      });
      console.log(`Container "${this.containerName}" is ready.`);
    } catch (error) {
      console.error('Error creating container:', error.message);
    }
  }

  async uploadFile(fileBuffer, originalName, mimeType) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const fileExtension = path.extname(originalName);
      const fileName = `${uuidv4()}${fileExtension}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: mimeType
        },
        metadata: {
          originalName: originalName,
          uploadDate: new Date().toISOString()
        }
      };

      await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);
      
      return {
        fileName: fileName,
        url: blockBlobClient.url,
        size: fileBuffer.length
      };
    } catch (error) {
      console.error('Error uploading file to Azure Blob Storage:', error);
      throw new Error('Failed to upload file to Azure Blob Storage');
    }
  }

  async deleteFile(fileName) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();
      return true;
    } catch (error) {
      console.error('Error deleting file from Azure Blob Storage:', error);
      return false;
    }
  }

  async getFileUrl(fileName) {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    return blockBlobClient.url;
  }

  async listFiles(prefix = '') {
    if (!this.blobServiceClient) {
      throw new Error('Azure Blob Storage is not configured');
    }

    try {
      const files = [];
      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          url: `${this.containerClient.url}/${blob.name}`,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified
        });
      }
      return files;
    } catch (error) {
      console.error('Error listing files from Azure Blob Storage:', error);
      throw error;
    }
  }
}

module.exports = new AzureBlobStorage();
