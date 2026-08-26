const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const config = require('../../config');
const logger = require('../utils/logger');

/**
 * AuthService - Handles authentication, authorization, and MFA
 */
class AuthService {
  constructor() {
    this.users = new Map(); // In production, use database
    this.tokens = new Set(); // Blacklisted tokens
  }

  /**
   * Register a new user
   * @param {Object} userData - { email, password, role }
   * @returns {Object} User object without password
   */
  async registerUser(userData) {
    const { email, password, role = 'user' } = userData;

    if (this.users.has(email)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, config.security.saltRounds);
    
    const user = {
      id: crypto.randomBytes(16).toString('hex'),
      email,
      password: hashedPassword,
      role, // 'admin', 'user', 'readonly'
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: Date.now()
    };

    this.users.set(email, user);
    logger.info(`User registered: ${email}`);

    return this._sanitizeUser(user);
  }

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Object} { user, accessToken, refreshToken, requiresMFA }
   */
  async login(email, password) {
    const user = this.users.get(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const response = {
      user: this._sanitizeUser(user),
      requiresMFA: user.mfaEnabled
    };

    if (!user.mfaEnabled) {
      const tokens = this._generateTokens(user);
      response.accessToken = tokens.accessToken;
      response.refreshToken = tokens.refreshToken;
    }

    logger.info(`User logged in: ${email}`);
    return response;
  }

  /**
   * Verify MFA token and complete login
   * @param {string} email 
   * @param {string} token 
   * @returns {Object} { accessToken, refreshToken }
   */
  verifyMFA(email, token) {
    const user = this.users.get(email);
    
    if (!user || !user.mfaEnabled) {
      throw new Error('MFA not enabled for user');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: config.security.mfa.window
    });

    if (!verified) {
      throw new Error('Invalid MFA token');
    }

    const tokens = this._generateTokens(user);
    logger.info(`MFA verified for: ${email}`);
    
    return tokens;
  }

  /**
   * Setup MFA for user
   * @param {string} email 
   * @returns {Object} { secret, otpauthUrl, qrCode }
   */
  async setupMFA(email) {
    const user = this.users.get(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${config.security.mfa.issuer}:${email}`,
      issuer: config.security.mfa.issuer
    });

    user.mfaSecret = secret.base32;
    this.users.set(email, user);

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    logger.info(`MFA setup initiated for: ${email}`);
    
    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode
    };
  }

  /**
   * Enable MFA (after verification)
   * @param {string} email 
   * @param {string} token 
   */
  enableMFA(email, token) {
    const user = this.users.get(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: config.security.mfa.window
    });

    if (!verified) {
      throw new Error('Invalid verification token');
    }

    user.mfaEnabled = true;
    this.users.set(email, user);
    
    logger.info(`MFA enabled for: ${email}`);
  }

  /**
   * Disable MFA
   * @param {string} email 
   * @param {string} password 
   */
  async disableMFA(email, password) {
    const user = this.users.get(email);
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      throw new Error('Invalid password');
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    this.users.set(email, user);
    
    logger.info(`MFA disabled for: ${email}`);
  }

  /**
   * Refresh access token
   * @param {string} refreshToken 
   * @returns {Object} { accessToken, refreshToken }
   */
  refreshTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.security.jwtSecret);
      
      if (this.tokens.has(refreshToken)) {
        throw new Error('Token has been revoked');
      }

      const user = this.users.get(decoded.email);
      
      if (!user) {
        throw new Error('User not found');
      }

      return this._generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user (blacklist tokens)
   * @param {string} accessToken 
   * @param {string} refreshToken 
   */
  logout(accessToken, refreshToken) {
    this.tokens.add(accessToken);
    this.tokens.add(refreshToken);
    
    // Schedule removal from blacklist (after expiry)
    setTimeout(() => {
      this.tokens.delete(accessToken);
      this.tokens.delete(refreshToken);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Verify JWT token
   * @param {string} token 
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    if (this.tokens.has(token)) {
      throw new Error('Token has been revoked');
    }

    return jwt.verify(token, config.security.jwtSecret);
  }

  /**
   * Check user role
   * @param {string} email 
   * @param {string[]} requiredRoles 
   * @returns {boolean}
   */
  hasRole(email, requiredRoles) {
    const user = this.users.get(email);
    
    if (!user) return false;
    
    return requiredRoles.includes(user.role);
  }

  /**
   * Encrypt sensitive data
   * @param {string} data 
   * @returns {string} Encrypted data (hex)
   */
  encrypt(data) {
    const cipher = crypto.createCipher('aes-256-cbc', config.security.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData 
   * @returns {string} Decrypted data
   */
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher('aes-256-cbc', config.security.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Private methods

  _generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        email: user.email, 
        role: user.role,
        type: 'access'
      },
      config.security.jwtSecret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { 
        email: user.email, 
        type: 'refresh'
      },
      config.security.jwtSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  _sanitizeUser(user) {
    const { password, mfaSecret, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
