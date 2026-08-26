const express = require('express');
const { body, validationResult } = require('express-validator');
const neuronGraphService = require('../services/NeuronGraphService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/neurons/register
 * @desc    Register a new neuron (neuron.json manifest)
 * @access  Public (or authenticated in production)
 */
router.post(
  '/register',
  [
    body('id').notEmpty().withMessage('Neuron ID is required'),
    body('version').notEmpty().withMessage('Version is required'),
    body('domain').notEmpty().withMessage('Domain is required'),
    body('entrypoint').isURL().withMessage('Valid entrypoint URL is required'),
    body('capabilities').isArray().withMessage('Capabilities must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const neuronId = neuronGraphService.registerNeuron(req.body);
      
      logger.info(`Neuron registered: ${neuronId}`);
      
      res.status(201).json({
        success: true,
        message: 'Neuron registered successfully',
        data: {
          id: neuronId,
          status: 'pending',
          registeredAt: Date.now()
        }
      });
    } catch (error) {
      logger.error(`Error registering neuron: ${error.message}`, { error });
      res.status(500).json({
        success: false,
        message: 'Failed to register neuron',
        error: error.message
      });
    }
  }
);

/**
 * @route   PATCH /api/neurons/handshake
 * @desc    Update neuron health/status (heartbeat)
 * @access  Public (or authenticated)
 */
router.patch(
  '/handshake',
  [
    body('neuron_id').notEmpty().withMessage('Neuron ID is required'),
    body('status').optional().isIn(['online', 'offline', 'degraded']).withMessage('Invalid status'),
    body('health').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { neuron_id, status, health = {} } = req.body;

      neuronGraphService.updateHealth(neuron_id, { status, health });

      logger.debug(`Handshake received from: ${neuron_id}`);

      res.json({
        success: true,
        message: 'Health updated',
        data: {
          neuronId: neuron_id,
          status: status || 'online',
          timestamp: Date.now()
        }
      });
    } catch (error) {
      logger.error(`Error updating health: ${error.message}`, { error });
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update health',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/neurons
 * @desc    Get all neurons with optional filtering
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { domain, capability, status, healthyOnly } = req.query;
    
    const filters = {};
    if (domain) filters.domain = domain;
    if (capability) filters.capability = capability;
    if (status) filters.status = status;
    if (healthyOnly === 'true') filters.healthyOnly = true;

    const neurons = neuronGraphService.getNeurons(filters);

    res.json({
      success: true,
      count: neurons.length,
      data: neurons
    });
  } catch (error) {
    logger.error(`Error fetching neurons: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch neurons',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/neurons/:id
 * @desc    Get specific neuron details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const neurons = neuronGraphService.getNeurons();
    const neuron = neurons.find(n => n.id === req.params.id);

    if (!neuron) {
      return res.status(404).json({
        success: false,
        message: 'Neuron not found'
      });
    }

    res.json({
      success: true,
      data: neuron
    });
  } catch (error) {
    logger.error(`Error fetching neuron: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch neuron',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/neurons/:id
 * @desc    Deregister a neuron
 * @access  Admin only
 */
router.delete('/:id', async (req, res) => {
  try {
    neuronGraphService.deregisterNeuron(req.params.id);

    logger.info(`Neuron deregistered: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Neuron deregistered successfully'
    });
  } catch (error) {
    logger.error(`Error deregistering neuron: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to deregister neuron',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/neurons/stats
 * @desc    Get graph statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = neuronGraphService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error fetching stats: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

module.exports = router;
