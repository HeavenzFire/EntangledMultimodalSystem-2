const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/AuthService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['user', 'admin', 'readonly']).withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role } = req.body;
      const user = await authService.registerUser({ email, password, role });

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`, { error });
      
      if (error.message === 'User already exists') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: result.requiresMFA ? 'MFA verification required' : 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error(`Error logging in: ${error.message}`, { error });
      
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-mfa
 * @desc    Verify MFA token and complete login
 * @access  Public (after login with MFA enabled)
 */
router.post(
  '/verify-mfa',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('MFA token must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, token } = req.body;
      const tokens = authService.verifyMFA(email, token);

      logger.info(`MFA verified for: ${email}`);

      res.json({
        success: true,
        message: 'MFA verified successfully',
        data: tokens
      });
    } catch (error) {
      logger.error(`Error verifying MFA: ${error.message}`, { error });
      
      if (error.message.includes('MFA') || error.message.includes('Invalid')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to verify MFA',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/auth/setup-mfa
 * @desc    Setup MFA for user
 * @access  Authenticated
 */
router.post('/setup-mfa', async (req, res) => {
  try {
    // In production, get email from authenticated session
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const mfaSetup = await authService.setupMFA(email);

    logger.info(`MFA setup initiated for: ${email}`);

    res.json({
      success: true,
      message: 'MFA setup initiated. Scan QR code and verify.',
      data: {
        secret: mfaSetup.secret,
        otpauthUrl: mfaSetup.otpauthUrl,
        qrCode: mfaSetup.qrCode
      }
    });
  } catch (error) {
    logger.error(`Error setting up MFA: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to setup MFA',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/enable-mfa
 * @desc    Enable MFA after verification
 * @access  Authenticated
 */
router.post(
  '/enable-mfa',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, token } = req.body;
      authService.enableMFA(email, token);

      logger.info(`MFA enabled for: ${email}`);

      res.json({
        success: true,
        message: 'MFA enabled successfully'
      });
    } catch (error) {
      logger.error(`Error enabling MFA: ${error.message}`, { error });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (with valid refresh token)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const tokens = authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`, { error });
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (blacklist tokens)
 * @access  Authenticated
 */
router.post('/logout', async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body;

    if (accessToken && refreshToken) {
      authService.logout(accessToken, refreshToken);
    }

    logger.info('User logged out');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error(`Error logging out: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: error.message
    });
  }
});

module.exports = router;
