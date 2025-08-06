const express = require('express');
const router = express.Router();
const User = require('../models/User');
const azureAuth = require('../middleware/azureAuth');
const azureCosmosDB = require('../services/azureCosmosDB');

// @route   GET /api/auth/login-url
// @desc    Get Azure AD B2C login URL
// @access  Public
router.get('/login-url', async (req, res) => {
  try {
    if (azureAuth.enabled) {
      const authUrl = await azureAuth.getAuthUrl();
      res.json({ authUrl });
    } else {
      // Development fallback
      res.json({ 
        authUrl: '/api/auth/dev-login',
        message: 'Development mode - Azure AD B2C not configured'
      });
    }
  } catch (error) {
    console.error('Error getting login URL:', error);
    res.status(500).json({ message: 'Failed to get login URL' });
  }
});

// @route   POST /api/auth/callback
// @desc    Handle Azure AD B2C callback
// @access  Public
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    let tokenResponse;
    let userInfo;

    if (azureAuth.enabled) {
      tokenResponse = await azureAuth.handleCallback(code);
      userInfo = {
        azureId: tokenResponse.account.homeAccountId,
        email: tokenResponse.account.username,
        firstName: tokenResponse.account.name?.split(' ')[0] || '',
        lastName: tokenResponse.account.name?.split(' ').slice(1).join(' ') || '',
        name: tokenResponse.account.name
      };
    } else {
      // Development fallback
      return res.status(400).json({ 
        message: 'Azure AD B2C not configured. Use /api/auth/dev-login for development.' 
      });
    }

    // Create or update user in database
    let user;
    
    if (process.env.USE_COSMOS_DB === 'true' && azureCosmosDB.enabled) {
      // Use Cosmos DB
      user = await azureCosmosDB.getUserByAzureId(userInfo.azureId);
      
      if (!user) {
        user = await azureCosmosDB.createUser({
          azureId: userInfo.azureId,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: 'user',
          isActive: true,
          lastLogin: new Date()
        });
      } else {
        user = await azureCosmosDB.updateUser(userInfo.azureId, {
          lastLogin: new Date(),
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        });
      }
    } else {
      // Use MongoDB
      user = await User.findOne({ azureId: userInfo.azureId });
      
      if (!user) {
        user = new User({
          azureId: userInfo.azureId,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: 'user',
          isActive: true,
          lastLogin: new Date()
        });
        await user.save();
      } else {
        user.lastLogin = new Date();
        user.firstName = userInfo.firstName;
        user.lastName = userInfo.lastName;
        await user.save();
      }
    }

    res.json({
      message: 'Authentication successful',
      token: tokenResponse.accessToken,
      user: {
        id: user.id || user.azureId,
        azureId: user.azureId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(400).json({ message: 'Authentication failed', error: error.message });
  }
});

// @route   POST /api/auth/dev-login
// @desc    Development login (fallback when Azure AD B2C is not configured)
// @access  Public
router.post('/dev-login', async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const azureId = `dev_${email.replace('@', '_').replace('.', '_')}`;
    
    // Create or update user
    let user = await User.findOne({ azureId });
    
    if (!user) {
      user = new User({
        azureId,
        email,
        firstName: firstName || 'Dev',
        lastName: lastName || 'User',
        role: email.includes('admin') ? 'admin' : 'user',
        isActive: true,
        lastLogin: new Date()
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate fallback token
    const token = azureAuth.generateFallbackToken({
      azureId: user.azureId,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName
    });

    res.json({
      message: 'Development login successful',
      token,
      user: {
        id: user._id,
        azureId: user.azureId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Development login error:', error);
    res.status(500).json({ message: 'Development login failed', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', azureAuth.middleware(), async (req, res) => {
  try {
    let user;
    
    if (process.env.USE_COSMOS_DB === 'true' && azureCosmosDB.enabled) {
      user = await azureCosmosDB.getUserByAzureId(req.user.azureId);
    } else {
      user = await User.findOne({ azureId: req.user.azureId });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id || user.azureId,
        azureId: user.azureId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ message: 'Failed to get user information' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', azureAuth.middleware(), async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    
    let user;
    
    if (process.env.USE_COSMOS_DB === 'true' && azureCosmosDB.enabled) {
      user = await azureCosmosDB.updateUser(req.user.azureId, {
        firstName,
        lastName,
        phoneNumber,
        address
      });
    } else {
      user = await User.findOne({ azureId: req.user.azureId });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (address) user.address = address;

      await user.save();
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id || user.azureId,
        azureId: user.azureId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate session)
// @access  Private
router.post('/logout', azureAuth.middleware(), async (req, res) => {
  try {
    // In a full implementation, you might want to blacklist the token
    // For now, we'll just return success
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
