// Azure Cosmos DB Claim Model
// This model represents claim data structure for Azure Cosmos DB

class Claim {
  constructor(claimData = {}) {
    this.id = claimData.id || this.generateId();
    this.claimNumber = claimData.claimNumber || this.generateClaimNumber();
    this.userId = claimData.userId; // Azure AD user ID
    this.azureId = claimData.azureId || claimData.userId; // For compatibility
    
    this.vehicleInfo = claimData.vehicleInfo || {
      make: '',
      model: '',
      year: null,
      licensePlate: '',
      vin: '',
      color: ''
    };
    
    this.incidentDetails = claimData.incidentDetails || {
      dateOfIncident: null,
      timeOfIncident: '',
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: {
          lat: null,
          lng: null
        }
      },
      description: '',
      weatherConditions: '',
      roadConditions: '',
      trafficConditions: ''
    };
    
    this.damageAssessment = claimData.damageAssessment || {
      vehicleDamageDescription: '',
      estimatedRepairCost: 0,
      photos: [],
      aiAnalysis: {
        damageConfidence: 0,
        damageSeverity: 'unknown',
        detectedDamageTypes: [],
        estimatedCost: 0,
        analysisDate: null
      }
    };
    
    this.documentation = claimData.documentation || {
      photos: [],
      videos: [],
      documents: [],
      policeReportNumber: '',
      witnessInfo: []
    };
    
    this.status = claimData.status || 'draft';
    this.priority = claimData.priority || 'medium';
    this.assignedTo = claimData.assignedTo || null;
    
    this.financialInfo = claimData.financialInfo || {
      estimatedAmount: 0,
      approvedAmount: 0,
      deductible: 0,
      paymentStatus: 'pending'
    };
    
    this.timeline = claimData.timeline || [];
    this.notes = claimData.notes || [];
    
    this.createdAt = claimData.createdAt || new Date().toISOString();
    this.updatedAt = claimData.updatedAt || new Date().toISOString();
    this.submittedAt = claimData.submittedAt || null;
    this.processedAt = claimData.processedAt || null;
    this.completedAt = claimData.completedAt || null;
  }

  generateId() {
    return 'claim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateClaimNumber() {
    const prefix = 'CLM';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Convert to Cosmos DB document format
  toCosmosDocument() {
    return {
      id: this.id,
      claimNumber: this.claimNumber,
      userId: this.userId,
      azureId: this.azureId,
      vehicleInfo: this.vehicleInfo,
      incidentDetails: this.incidentDetails,
      damageAssessment: this.damageAssessment,
      documentation: this.documentation,
      status: this.status,
      priority: this.priority,
      assignedTo: this.assignedTo,
      financialInfo: this.financialInfo,
      timeline: this.timeline,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      submittedAt: this.submittedAt,
      processedAt: this.processedAt,
      completedAt: this.completedAt
    };
  }

  // Validation method
  validate() {
    const errors = [];
    
    if (!this.userId) errors.push('User ID is required');
    if (!this.vehicleInfo.make) errors.push('Vehicle make is required');
    if (!this.vehicleInfo.model) errors.push('Vehicle model is required');
    if (!this.vehicleInfo.year) errors.push('Vehicle year is required');
    if (!this.vehicleInfo.licensePlate) errors.push('License plate is required');
    if (!this.incidentDetails.dateOfIncident) errors.push('Incident date is required');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update claim data
  update(updateData) {
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && key !== 'claimNumber' && key !== 'createdAt' && updateData[key] !== undefined) {
        this[key] = updateData[key];
      }
    });
    this.updatedAt = new Date().toISOString();
  }

  // Add timeline entry
  addTimelineEntry(entry) {
    this.timeline.push({
      id: 'timeline_' + Date.now(),
      timestamp: new Date().toISOString(),
      action: entry.action,
      description: entry.description,
      user: entry.user,
      details: entry.details || {}
    });
    this.updatedAt = new Date().toISOString();
  }

  // Add note
  addNote(note) {
    this.notes.push({
      id: 'note_' + Date.now(),
      timestamp: new Date().toISOString(),
      author: note.author,
      content: note.content,
      type: note.type || 'general'
    });
    this.updatedAt = new Date().toISOString();
  }

  // Update status
  updateStatus(newStatus, user = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    this.addTimelineEntry({
      action: 'status_change',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      user: user
    });

    // Set timestamps based on status
    switch (newStatus) {
      case 'submitted':
        this.submittedAt = new Date().toISOString();
        break;
      case 'processing':
        this.processedAt = new Date().toISOString();
        break;
      case 'completed':
      case 'closed':
        this.completedAt = new Date().toISOString();
        break;
    }
  }

  // Calculate total estimated cost
  getTotalEstimatedCost() {
    return this.damageAssessment.estimatedRepairCost + this.financialInfo.deductible;
  }

  // Get status display
  getStatusDisplay() {
    const statusMap = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'processing': 'Processing',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed',
      'closed': 'Closed'
    };
    return statusMap[this.status] || this.status;
  }
}

module.exports = Claim;
