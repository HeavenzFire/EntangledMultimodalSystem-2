const express = require('express');
const { body, validationResult } = require('express-validator');
const neuronGraphService = require('../services/NeuronGraphService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/pathways
 * @desc    Find pathways between neurons
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { from, to, maxHops, capabilities } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: from and to'
      });
    }

    const options = {};
    if (maxHops) options.maxHops = parseInt(maxHops);
    if (capabilities) {
      options.requiredCapabilities = capabilities.split(',');
    }

    const pathways = neuronGraphService.findPathways(from, to, options);

    res.json({
      success: true,
      count: pathways.length,
      data: pathways
    });
  } catch (error) {
    logger.error(`Error finding pathways: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to find pathways',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pathways/execute
 * @desc    Execute a pathway (sends messages through the chain)
 * @access  Authenticated
 */
router.post('/execute', async (req, res) => {
  try {
    const { pathwayId, steps, payload } = req.body;

    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        message: 'Steps array is required'
      });
    }

    // In production, this would integrate with message bus (NATS/Kafka)
    // For now, we simulate execution
    const executionResult = {
      pathwayId: pathwayId || `exec_${Date.now()}`,
      status: 'completed',
      startedAt: Date.now(),
      steps: [],
      totalLatencyMs: 0
    };

    let currentPayload = payload;

    for (const step of steps) {
      const { neuron, capability } = step;
      
      // Select best neuron instance for this capability
      const selectedNeuron = neuronGraphService.selectBestNeuron(capability) || 
                            neuronGraphService.getNeurons().find(n => n.id === neuron);

      if (!selectedNeuron) {
        executionResult.status = 'failed';
        executionResult.error = `No available neuron for capability: ${capability}`;
        break;
      }

      // Simulate API call to neuron
      const stepStart = Date.now();
      
      // In production: send message via bus and wait for response
      const stepResult = {
        neuronId: selectedNeuron.id,
        capability,
        entrypoint: selectedNeuron.entrypoint,
        status: 'success',
        latencyMs: Math.floor(Math.random() * 100) + 20, // Simulated
        timestamp: stepStart
      };

      executionResult.steps.push(stepResult);
      executionResult.totalLatencyMs += stepResult.latencyMs;

      // Pass output to next step
      currentPayload = {
        ...currentPayload,
        previousStep: stepResult
      };
    }

    executionResult.completedAt = Date.now();
    executionResult.result = currentPayload;

    logger.info(`Pathway executed: ${executionResult.pathwayId}`, {
      status: executionResult.status,
      steps: executionResult.steps.length
    });

    res.json({
      success: true,
      data: executionResult
    });
  } catch (error) {
    logger.error(`Error executing pathway: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to execute pathway',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pathways/:id/status
 * @desc    Get pathway execution status (for async executions)
 * @access  Authenticated
 */
router.get('/:id/status', async (req, res) => {
  try {
    // In production, fetch from database/cache
    res.json({
      success: true,
      data: {
        pathwayId: req.params.id,
        status: 'not_found',
        message: 'Pathway execution tracking requires persistent storage'
      }
    });
  } catch (error) {
    logger.error(`Error fetching pathway status: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pathway status',
      error: error.message
    });
  }
});

module.exports = router;
