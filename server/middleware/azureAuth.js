const { ConfidentialClientApplication } = require('@azure/msal-node');
const jwt = require('jsonwebtoken');
const axios = require('axios');

class AzureADB2CAuth {
  constructor() {
    this.tenantId = process.env.AZURE_AD_B2C_TENANT_ID;
    this.clientId = process.env.AZURE_AD_B2C_CLIENT_ID;
    this.clientSecret = process.env.AZURE_AD_B2C_CLIENT_SECRET;
    this.signUpSignInPolicyName = process.env.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY || 'B2C_1_signupsignin';
    this.redirectUri = process.env.AZURE_AD_B2C_REDIRECT_URI || 'http://localhost:3000/auth/callback';
    
    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      console.warn('Azure AD B2C credentials not found. Authentication will use fallback JWT.');
      this.enabled = false;
      return;
    }

    this.authority = `https://${this.tenantId}.b2clogin.com/${this.tenantId}.onmicrosoft.com/${this.signUpSignInPolicyName}`;
    this.jwksUri = `https://${this.tenantId}.b2clogin.com/${this.tenantId}.onmicrosoft.com/${this.signUpSignInPolicyName}/discovery/v2.0/keys`;
    
    this.msalConfig = {
      auth: {
        clientId: this.clientId,
        authority: this.authority,
        clientSecret: this.clientSecret
      },
      system: {
        loggerOptions: {
          loggerCallback: (loglevel, message, containsPii) => {
            if (!containsPii) {
              console.log(message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: 'Error'
        }
      }
    };

    this.cca = new ConfidentialClientApplication(this.msalConfig);
    this.enabled = true;
    this.jwksKeys = null;
    this.loadJWKS();
  }

  async loadJWKS() {
    try {
      const response = await axios.get(this.jwksUri);
      this.jwksKeys = response.data.keys;
      console.log('JWKS keys loaded successfully');
    } catch (error) {
      console.error('Error loading JWKS keys:', error.message);
    }
  }

  getAuthUrl() {
    if (!this.enabled) {
      throw new Error('Azure AD B2C is not configured');
    }

    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email'],
      redirectUri: this.redirectUri,
    };

    return this.cca.getAuthCodeUrl(authCodeUrlParameters);
  }

  async handleCallback(authCode) {
    if (!this.enabled) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      const tokenRequest = {
        code: authCode,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: this.redirectUri,
      };

      const response = await this.cca.acquireTokenByCode(tokenRequest);
      return {
        accessToken: response.accessToken,
        idToken: response.idToken,
        account: response.account
      };
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw new Error('Authentication failed');
    }
  }

  async verifyToken(token) {
    if (!this.enabled) {
      // Fallback JWT verification for development
      return this.verifyFallbackToken(token);
    }

    try {
      // Decode token header to get kid
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader) {
        throw new Error('Invalid token format');
      }

      const kid = decodedHeader.header.kid;
      
      // Find matching key from JWKS
      const key = this.jwksKeys?.find(k => k.kid === kid);
      if (!key) {
        // Reload JWKS in case keys have been rotated
        await this.loadJWKS();
        const refreshedKey = this.jwksKeys?.find(k => k.kid === kid);
        if (!refreshedKey) {
          throw new Error('No matching key found in JWKS');
        }
      }

      // Convert JWK to PEM format for verification
      const publicKey = this.jwkToPem(key || this.jwksKeys.find(k => k.kid === kid));

      // Verify token
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: this.clientId,
        issuer: this.authority.replace('/oauth2/v2.0', '')
      });

      return {
        valid: true,
        decoded,
        azureId: decoded.sub || decoded.oid,
        email: decoded.emails?.[0] || decoded.email,
        name: decoded.name,
        firstName: decoded.given_name,
        lastName: decoded.family_name
      };
    } catch (error) {
      console.error('Token verification error:', error.message);
      return { valid: false, error: error.message };
    }
  }

  verifyFallbackToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      return {
        valid: true,
        decoded,
        azureId: decoded.sub || decoded.id,
        email: decoded.email,
        name: decoded.name,
        firstName: decoded.firstName,
        lastName: decoded.lastName
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  generateFallbackToken(userData) {
    const payload = {
      sub: userData.azureId || userData.id,
      email: userData.email,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
  }

  jwkToPem(jwk) {
    // Convert JWK to PEM format
    // This is a simplified implementation - in production, use a library like 'jwk-to-pem'
    const { n, e } = jwk;
    
    // For now, return a placeholder - in production, implement proper JWK to PEM conversion
    // or use the 'jwk-to-pem' npm package
    throw new Error('JWK to PEM conversion not implemented. Please use jwk-to-pem package.');
  }

  async getUserInfo(accessToken) {
    if (!this.enabled) {
      throw new Error('Azure AD B2C is not configured');
    }

    try {
      const response = await axios.get(`https://graph.microsoft.com/v1.0/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error.message);
      throw new Error('Failed to get user information');
    }
  }

  middleware() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const verification = await this.verifyToken(token);

        if (!verification.valid) {
          return res.status(401).json({ message: 'Invalid token', error: verification.error });
        }

        req.user = {
          azureId: verification.azureId,
          email: verification.email,
          name: verification.name,
          firstName: verification.firstName,
          lastName: verification.lastName
        };

        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Authentication failed' });
      }
    };
  }

  adminMiddleware() {
    return async (req, res, next) => {
      try {
        // First verify the user is authenticated
        await new Promise((resolve, reject) => {
          this.middleware()(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Check if user has admin role
        // This would typically check against your user database
        const User = require('../models/User');
        const user = await User.findOne({ azureId: req.user.azureId });
        
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }

        next();
      } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(403).json({ message: 'Admin access required' });
      }
    };
  }
}

module.exports = new AzureADB2CAuth();
