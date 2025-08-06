const { CosmosClient } = require('@azure/cosmos');

class AzureCosmosDB {
  constructor() {
    this.endpoint = process.env.AZURE_COSMOS_DB_ENDPOINT;
    this.key = process.env.AZURE_COSMOS_DB_KEY;
    this.databaseId = process.env.AZURE_COSMOS_DB_DATABASE_ID || 'AutoClaimAI';
    
    if (!this.endpoint || !this.key) {
      console.warn('Azure Cosmos DB credentials not found. Using MongoDB fallback.');
      this.enabled = false;
      return;
    }
    
    this.client = new CosmosClient({ 
      endpoint: this.endpoint, 
      key: this.key 
    });
    
    this.enabled = true;
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: this.databaseId
      });
      
      this.database = database;
      
      // Create containers (collections) if they don't exist
      await this.createContainers();
      
      console.log('Azure Cosmos DB initialized successfully');
    } catch (error) {
      console.error('Error initializing Azure Cosmos DB:', error);
      this.enabled = false;
    }
  }

  async createContainers() {
    const containers = [
      {
        id: 'users',
        partitionKey: '/azureId'
      },
      {
        id: 'claims',
        partitionKey: '/userId'
      },
      {
        id: 'communications',
        partitionKey: '/claimId'
      }
    ];

    for (const containerDef of containers) {
      try {
        await this.database.containers.createIfNotExists(containerDef);
        console.log(`Container '${containerDef.id}' ready`);
      } catch (error) {
        console.error(`Error creating container '${containerDef.id}':`, error);
      }
    }
  }

  async createUser(userData) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('users');
      const { resource } = await container.items.create({
        ...userData,
        id: userData.azureId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return resource;
    } catch (error) {
      console.error('Error creating user in Cosmos DB:', error);
      throw error;
    }
  }

  async getUserByAzureId(azureId) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('users');
      const { resource } = await container.item(azureId, azureId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error getting user from Cosmos DB:', error);
      throw error;
    }
  }

  async updateUser(azureId, updateData) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('users');
      const { resource: existingUser } = await container.item(azureId, azureId).read();
      
      const updatedUser = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const { resource } = await container.item(azureId, azureId).replace(updatedUser);
      return resource;
    } catch (error) {
      console.error('Error updating user in Cosmos DB:', error);
      throw error;
    }
  }

  async createClaim(claimData) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('claims');
      const claimWithId = {
        ...claimData,
        id: claimData.claimNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const { resource } = await container.items.create(claimWithId);
      return resource;
    } catch (error) {
      console.error('Error creating claim in Cosmos DB:', error);
      throw error;
    }
  }

  async getClaimsByUserId(userId) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('claims');
      const query = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: userId }]
      };
      
      const { resources } = await container.items.query(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error getting claims from Cosmos DB:', error);
      throw error;
    }
  }

  async updateClaimStatus(claimNumber, status, adminNotes = '') {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('claims');
      const { resource: existingClaim } = await container.item(claimNumber).read();
      
      const updatedClaim = {
        ...existingClaim,
        status,
        adminNotes,
        updatedAt: new Date().toISOString()
      };

      if (status === 'closed') {
        updatedClaim.closedAt = new Date().toISOString();
      }
      
      const { resource } = await container.item(claimNumber).replace(updatedClaim);
      return resource;
    } catch (error) {
      console.error('Error updating claim status in Cosmos DB:', error);
      throw error;
    }
  }

  async getAllClaims(filter = {}) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('claims');
      let query = 'SELECT * FROM c';
      const parameters = [];

      if (filter.status) {
        query += ' WHERE c.status = @status';
        parameters.push({ name: '@status', value: filter.status });
      }

      query += ' ORDER BY c.createdAt DESC';

      const { resources } = await container.items.query({
        query,
        parameters
      }).fetchAll();
      
      return resources;
    } catch (error) {
      console.error('Error getting all claims from Cosmos DB:', error);
      throw error;
    }
  }

  async addCommunication(communicationData) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('communications');
      const communication = {
        ...communicationData,
        id: `${communicationData.claimId}_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      
      const { resource } = await container.items.create(communication);
      return resource;
    } catch (error) {
      console.error('Error adding communication to Cosmos DB:', error);
      throw error;
    }
  }

  async getCommunicationsByClaimId(claimId) {
    if (!this.enabled) {
      throw new Error('Azure Cosmos DB is not enabled');
    }

    try {
      const container = this.database.container('communications');
      const query = {
        query: 'SELECT * FROM c WHERE c.claimId = @claimId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@claimId', value: claimId }]
      };
      
      const { resources } = await container.items.query(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error getting communications from Cosmos DB:', error);
      throw error;
    }
  }
}

module.exports = new AzureCosmosDB();
