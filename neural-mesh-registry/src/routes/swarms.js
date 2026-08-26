/**
 * Swarm Management Routes
 * RESTful API for agentic swarm orchestration
 */

import express from 'express';
import { swarmOrchestrator } from '../services/SwarmOrchestrator.js';
import { registry } from '../services/registry.js';

const router = express.Router();

/**
 * GET /api/swarms
 * Get all active swarms with metrics
 */
router.get('/', (req, res) => {
  try {
    const swarms = swarmOrchestrator.getAllSwarms();
    const metrics = swarmOrchestrator.getMetrics();
    
    res.json({
      success: true,
      count: swarms.length,
      metrics,
      data: swarms
    });
  } catch (error) {
    console.error('Error fetching swarms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/swarms/:id
 * Get specific swarm details
 */
router.get('/:id', (req, res) => {
  try {
    const swarm = swarmOrchestrator.getSwarm(req.params.id);
    
    if (!swarm) {
      return res.status(404).json({
        success: false,
        error: 'Swarm not found'
      });
    }
    
    res.json({
      success: true,
      data: swarm
    });
  } catch (error) {
    console.error('Error fetching swarm:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/spawn
 * Spawn a new swarm
 * Body: { name, agentCount }
 */
router.post('/spawn', (req, res) => {
  try {
    const { name, agentCount = 10 } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Swarm name is required'
      });
    }
    
    // Get available neurons from registry
    const neurons = registry.getAllNeurons().filter(n => n.status === 'online');
    
    if (neurons.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No online neurons available for swarm creation'
      });
    }
    
    const swarm = swarmOrchestrator.spawnSwarm(name, agentCount, neurons);
    
    res.status(201).json({
      success: true,
      message: `Swarm "${name}" spawned successfully`,
      compressionDemo: {
        originalSize: 'varies',
        encodedSize: 'varies',
        reductionPercent: '~95%',
        note: 'Check server logs for actual compression stats'
      },
      data: swarm
    });
  } catch (error) {
    console.error('Error spawning swarm:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/:id/dispatch
 * Dispatch a task to a swarm
 * Body: { taskType, payload }
 */
router.post('/:id/dispatch', (req, res) => {
  try {
    const { taskType, payload } = req.body;
    
    if (!taskType) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required'
      });
    }
    
    const taskId = swarmOrchestrator.dispatchTask(req.params.id, taskType, payload || {});
    
    res.json({
      success: true,
      message: 'Task dispatched successfully',
      data: { taskId }
    });
  } catch (error) {
    console.error('Error dispatching task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/:id/converge
 * Converge swarm results
 */
router.post('/:id/converge', (req, res) => {
  try {
    const results = swarmOrchestrator.convergeSwarm(req.params.id);
    
    res.json({
      success: true,
      message: 'Swarm converged successfully',
      data: { results }
    });
  } catch (error) {
    console.error('Error converging swarm:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/:id/diverge
 * Diverge swarm into sub-swarms
 * Body: { subSwarmCount }
 */
router.post('/:id/diverge', (req, res) => {
  try {
    const { subSwarmCount = 3 } = req.body;
    
    const subSwarms = swarmOrchestrator.divergeSwarm(req.params.id, subSwarmCount);
    
    res.json({
      success: true,
      message: `Swarm diverged into ${subSwarmCount} sub-swarms`,
      data: { subSwarmIds: subSwarms }
    });
  } catch (error) {
    console.error('Error diverging swarm:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/:id/terminate
 * Terminate a swarm
 */
router.post('/:id/terminate', (req, res) => {
  try {
    const success = swarmOrchestrator.terminateSwarm(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Swarm not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Swarm terminated successfully'
    });
  } catch (error) {
    console.error('Error terminating swarm:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/:id/sync
 * Sync swarm state
 */
router.post('/:id/sync', (req, res) => {
  try {
    swarmOrchestrator.syncSwarm(req.params.id);
    
    res.json({
      success: true,
      message: 'Swarm synced successfully'
    });
  } catch (error) {
    console.error('Error syncing swarm:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/swarms/:id/simulate
 * Simulate task completion (for demo/testing)
 */
router.post('/:id/simulate', (req, res) => {
  try {
    swarmOrchestrator.simulateTaskCompletion(req.params.id);
    
    const swarm = swarmOrchestrator.getSwarm(req.params.id);
    
    res.json({
      success: true,
      message: 'Task completion simulated',
      data: swarm
    });
  } catch (error) {
    console.error('Error simulating tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/swarms/metrics
 * Get aggregated swarm metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = swarmOrchestrator.getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
