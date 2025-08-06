const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleInfo: {
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    licensePlate: { type: String, required: true },
    vin: String,
    color: String
  },
  incidentDetails: {
    dateOfIncident: { type: Date, required: true },
    timeOfIncident: String,
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    description: { type: String, required: true },
    weather: String,
    policeReportNumber: String
  },
  damageAssessment: {
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'pending'],
      default: 'pending'
    },
    aiAnalysis: {
      confidence: Number,
      detectedDamage: [String],
      estimatedCost: Number,
      analysisDate: Date
    },
    humanReview: {
      reviewed: { type: Boolean, default: false },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewDate: Date,
      notes: String
    }
  },
  images: [{
    originalName: String,
    filename: String,
    azureBlobUrl: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now },
    analysisResults: {
      damageDetected: Boolean,
      damageType: [String],
      confidence: Number
    }
  }],
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'closed'],
    default: 'submitted'
  },
  estimatedAmount: {
    type: Number,
    default: 0
  },
  approvedAmount: Number,
  rejectionReason: String,
  adminNotes: String,
  communications: [{
    type: { type: String, enum: ['email', 'sms', 'internal'] },
    subject: String,
    message: String,
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: Date
});

claimSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-generate claim number if not provided
  if (!this.claimNumber && this.isNew) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.claimNumber = `CLM-${timestamp.slice(-6)}-${random}`;
  }
  
  next();
});

// Index for better query performance
claimSchema.index({ userId: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ claimNumber: 1 });
claimSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);
