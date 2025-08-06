const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const User = require('../models/User');
const { uploadToBlob, deleteFromBlob } = require('../services/azureBlobStorage');
const { analyzeImage } = require('../services/azureComputerVision');
const { sendNotification } = require('../services/notificationService');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Submit a new claim
router.post('/submit', upload.array('images', 5), async (req, res) => {
  try {
    const { 
      userId, 
      vehicleInfo, 
      incidentDescription, 
      incidentDate, 
      location 
    } = req.body;

    // Validate required fields
    if (!userId || !vehicleInfo || !incidentDescription || !incidentDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, vehicleInfo, incidentDescription, incidentDate' 
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const imageUrls = [];
    const analysisResults = [];

    // Process uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Upload to Azure Blob Storage
          const imageUrl = await uploadToBlob(file.buffer, file.originalname, file.mimetype);
          imageUrls.push(imageUrl);

          // Analyze image with Azure Computer Vision
          const analysis = await analyzeImage(imageUrl);
          analysisResults.push(analysis);
        } catch (uploadError) {
          console.error('Error processing image:', uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    // Determine overall damage severity
    let overallSeverity = 'minor';
    const severityLevels = { minor: 1, moderate: 2, severe: 3 };
    
    for (const analysis of analysisResults) {
      if (severityLevels[analysis.severity] > severityLevels[overallSeverity]) {
        overallSeverity = analysis.severity;
      }
    }

    // Calculate estimated amount based on severity
    const baseAmount = 1000;
    const multipliers = { minor: 1, moderate: 2.5, severe: 5 };
    const estimatedAmount = baseAmount * multipliers[overallSeverity];

    // Create new claim
    const newClaim = new Claim({
      userId,
      claimNumber: `CLM${Date.now()}`,
      vehicleInfo: JSON.parse(vehicleInfo),
      incidentDescription,
      incidentDate: new Date(incidentDate),
      location,
      imageUrls,
      damageAnalysis: analysisResults,
      severity: overallSeverity,
      estimatedAmount,
      status: 'pending'
    });

    const savedClaim = await newClaim.save();

    // Send notification to user
    try {
      await sendNotification(
        user.email,
        'Claim Submitted Successfully',
        `Your claim ${savedClaim.claimNumber} has been submitted and is under review.`
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      message: 'Claim submitted successfully',
      claim: savedClaim
    });

  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// Get all claims for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const claims = await Claim.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Claim.countDocuments(filter);

    res.json({
      claims,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Get claim by ID
router.get('/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json(claim);

  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// Admin: Get all claims with filtering
router.get('/admin/all', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      severity, 
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const claims = await Claim.find(filter)
      .populate('userId', 'name email phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Claim.countDocuments(filter);

    // Calculate statistics
    const stats = await Claim.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$estimatedAmount' }
        }
      }
    ]);

    res.json({
      claims,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats
    });

  } catch (error) {
    console.error('Error fetching admin claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Admin: Update claim status
router.patch('/:claimId/status', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, reviewNotes, finalAmount } = req.body;

    // Validate status
    const validStatuses = ['pending', 'under-review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      reviewedAt: new Date()
    };

    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (finalAmount) updateData.finalAmount = finalAmount;

    const claim = await Claim.findByIdAndUpdate(
      claimId,
      updateData,
      { new: true }
    ).populate('userId', 'name email');

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Send notification to user about status update
    try {
      const statusMessages = {
        'under-review': 'Your claim is now under review by our team.',
        'approved': `Congratulations! Your claim has been approved${finalAmount ? ` for $${finalAmount}` : ''}.`,
        'rejected': 'Unfortunately, your claim has been rejected. Please check the review notes for details.'
      };

      if (statusMessages[status]) {
        await sendNotification(
          claim.userId.email,
          `Claim ${claim.claimNumber} Status Update`,
          statusMessages[status]
        );
      }
    } catch (notificationError) {
      console.error('Failed to send status notification:', notificationError);
    }

    res.json({
      message: 'Claim status updated successfully',
      claim
    });

  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ error: 'Failed to update claim status' });
  }
});

// Delete claim (admin only)
router.delete('/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Delete associated images from blob storage
    for (const imageUrl of claim.imageUrls) {
      try {
        await deleteFromBlob(imageUrl);
      } catch (deleteError) {
        console.error('Error deleting image from blob storage:', deleteError);
      }
    }

    await Claim.findByIdAndDelete(claimId);

    res.json({ message: 'Claim deleted successfully' });

  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ error: 'Failed to delete claim' });
  }
});

// Get claim statistics
router.get('/admin/statistics', async (req, res) => {
  try {
    const totalClaims = await Claim.countDocuments();
    
    const statusStats = await Claim.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const severityStats = await Claim.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          avgAmount: { $avg: '$estimatedAmount' }
        }
      }
    ]);

    const monthlyStats = await Claim.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$estimatedAmount' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      totalClaims,
      statusStats,
      severityStats,
      monthlyStats
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
