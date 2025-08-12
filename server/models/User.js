// Azure Cosmos DB User Model
// This model represents user data structure for Azure AD integration with Cosmos DB

class User {
  constructor(userData = {}) {
    this.id = userData.id || this.generateId();
    this.userId = userData.userId || userData.azureId; // Azure AD user ID
    this.azureId = userData.azureId || userData.userId; // For compatibility
    
    // Azure AD Profile Information
    this.profile = userData.profile || {
      displayName: '',
      givenName: '',
      surname: '',
      email: '',
      jobTitle: '',
      department: '',
      companyName: ''
    };
    
    // Application-specific data
    this.userInfo = userData.userInfo || {
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        language: 'en',
        timezone: 'UTC'
      }
    };
    
    // Insurance and claims data
    this.insuranceInfo = userData.insuranceInfo || {
      policyNumber: '',
      provider: '',
      coverageType: '',
      deductible: 0,
      premiumAmount: 0,
      policyStartDate: null,
      policyEndDate: null
    };
    
    // System metadata
    this.role = userData.role || 'user'; // user, admin, adjuster
    this.status = userData.status || 'active'; // active, inactive, suspended
    this.lastLoginAt = userData.lastLoginAt || null;
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = userData.updatedAt || new Date().toISOString();
    
    // Azure AD token information
    this.azureTokenInfo = userData.azureTokenInfo || {
      tokenVersion: null,
      issuer: null,
      audience: null,
      lastTokenRefresh: null
    };
  }

  generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Create User from Azure AD token
  static fromAzureADToken(tokenPayload) {
    return new User({
      azureId: tokenPayload.oid || tokenPayload.sub,
      userId: tokenPayload.oid || tokenPayload.sub,
      profile: {
        displayName: tokenPayload.name || '',
        givenName: tokenPayload.given_name || '',
        surname: tokenPayload.family_name || '',
        email: tokenPayload.email || tokenPayload.preferred_username || '',
        jobTitle: tokenPayload.jobTitle || '',
        department: tokenPayload.department || '',
        companyName: tokenPayload.companyName || ''
      },
      azureTokenInfo: {
        tokenVersion: tokenPayload.ver,
        issuer: tokenPayload.iss,
        audience: tokenPayload.aud,
        lastTokenRefresh: new Date().toISOString()
      }
    });
  }

  // Convert to Cosmos DB document format
  toCosmosDocument() {
    return {
      id: this.id,
      userId: this.userId,
      azureId: this.azureId,
      profile: this.profile,
      userInfo: this.userInfo,
      insuranceInfo: this.insuranceInfo,
      role: this.role,
      status: this.status,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      azureTokenInfo: this.azureTokenInfo
    };
  }

  // Validation method
  validate() {
    const errors = [];
    
    if (!this.userId) errors.push('User ID is required');
    if (!this.profile.email) errors.push('Email is required');
    if (!this.profile.displayName) errors.push('Display name is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update user data
  update(updateData) {
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'userId' && key !== 'azureId' && key !== 'createdAt' && updateData[key] !== undefined) {
        if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
          // Deep merge for nested objects
          this[key] = { ...this[key], ...updateData[key] };
        } else {
          this[key] = updateData[key];
        }
      }
    });
    this.updatedAt = new Date().toISOString();
  }

  // Update last login
  updateLastLogin() {
    this.lastLoginAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Check if user has role
  hasRole(role) {
    if (Array.isArray(this.role)) {
      return this.role.includes(role);
    }
    return this.role === role;
  }

  // Check if user is active
  isActive() {
    return this.status === 'active';
  }

  // Get display info
  getDisplayInfo() {
    return {
      id: this.id,
      userId: this.userId,
      displayName: this.profile.displayName,
      email: this.profile.email,
      role: this.role,
      status: this.status,
      lastLoginAt: this.lastLoginAt
    };
  }
}

module.exports = User;
