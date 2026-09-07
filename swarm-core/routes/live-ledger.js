/**
 * Live Ledger API Routes
 * 
 * Public API for the Sovereign Care Protocol Live Ledger.
 * Exposes real-time surplus-to-healing transaction streams and verification endpoints.
 */

import express from 'express';
import { LiveLedgerSystem, MedicalBill } from '../services/LiveLedger.js';

const router = express.Router();

// Initialize singleton Live Ledger instance
const liveLedger = new LiveLedgerSystem({
  HEALING_LATENCY_MS: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_THRESHOLD_MS: 60 * 60 * 1000, // 1 hour
  BROADCAST_INTERVAL: 5000 // 5 seconds
});

// Activate hive agents for autonomous allocation
liveLedger.activateHiveAgents(5);

/**
 * GET /api/live-ledger
 * Get comprehensive system status
 */
router.get('/', (req, res) => {
  try {
    const status = liveLedger.getStatus();
    res.json({
      success: true,
      timestamp: Date.now(),
      data: status
    });
  } catch (error) {
    console.error('Error fetching live ledger status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live-ledger/dashboard
 * Get public dashboard data - transaction stream and aggregated stats
 * Query params: limit (default: 100)
 */
router.get('/dashboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const data = liveLedger.getPublicDashboard(limit);
    
    res.json({
      success: true,
      timestamp: Date.now(),
      data
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live-ledger/tx/:hash
 * Get specific transaction by hash
 */
router.get('/tx/:hash', (req, res) => {
  try {
    const transaction = liveLedger.getTransactionByHash(req.params.hash);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live-ledger/stats
 * Get aggregated healing statistics
 */
router.get('/stats', (req, res) => {
  try {
    const status = liveLedger.getStatus();
    
    res.json({
      success: true,
      data: {
        totalHealing: status.dashboard.stats.totalHealing,
        totalPatientsHelped: status.dashboard.stats.totalPatientsHelped,
        totalBillsPaid: status.dashboard.stats.totalBillsPaid,
        surplusDetected: status.surplus.totalDetected,
        surplusAvailable: status.surplus.available,
        activeSources: status.surplus.sourceCount,
        allocationsMade: status.allocator.totalAllocations,
        billsInQueue: status.allocator.billsInQueue,
        pendingTransactions: status.router.pendingTransactions,
        completedTransactions: status.router.completedTransactions,
        latencyStats: status.router.latency,
        enforcementActions: status.accountability.enforcementActionsCount
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/live-ledger/surplus/report
 * Report surplus from a registered source
 * Body: { sourceId, amount, metadata? }
 */
router.post('/surplus/report', (req, res) => {
  try {
    const { sourceId, amount, metadata } = req.body;
    
    if (!sourceId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'sourceId and amount are required'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be positive'
      });
    }
    
    const event = liveLedger.reportSurplus(sourceId, amount, metadata);
    
    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Unknown or inactive surplus source'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Surplus reported successfully',
      data: event.toJSON()
    });
  } catch (error) {
    console.error('Error reporting surplus:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/live-ledger/bills/add
 * Add a verified medical bill to the queue
 * Body: { patientId, provider, amount, verificationHash }
 */
router.post('/bills/add', (req, res) => {
  try {
    const { patientId, provider, amount, verificationHash } = req.body;
    
    if (!patientId || !provider || !amount || !verificationHash) {
      return res.status(400).json({
        success: false,
        error: 'patientId, provider, amount, and verificationHash are required'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be positive'
      });
    }
    
    const bill = liveLedger.addMedicalBill(patientId, provider, amount, verificationHash);
    
    res.status(201).json({
      success: true,
      message: 'Medical bill added successfully',
      data: bill.toJSON()
    });
  } catch (error) {
    console.error('Error adding medical bill:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live-ledger/sources
 * List all registered surplus sources
 */
router.get('/sources', (req, res) => {
  try {
    const status = liveLedger.getStatus();
    const sources = Array.from(status.surplus.sources || []);
    
    res.json({
      success: true,
      count: sources.length,
      data: sources
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/live-ledger/sources/register
 * Register a new surplus source
 * Body: { sourceId, sourceType, config? }
 */
router.post('/sources/register', (req, res) => {
  try {
    const { sourceId, sourceType, config } = req.body;
    
    if (!sourceId || !sourceType) {
      return res.status(400).json({
        success: false,
        error: 'sourceId and sourceType are required'
      });
    }
    
    liveLedger.registerSurplusSource(sourceId, sourceType, config || {});
    
    res.status(201).json({
      success: true,
      message: `Surplus source ${sourceId} registered successfully`,
      data: { sourceId, sourceType, config: config || {} }
    });
  } catch (error) {
    console.error('Error registering source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live-ledger/accountability
 * Get accountability enforcement statistics
 */
router.get('/accountability', (req, res) => {
  try {
    const status = liveLedger.getStatus();
    
    res.json({
      success: true,
      data: status.accountability
    });
  } catch (error) {
    console.error('Error fetching accountability stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/live-ledger/latency
 * Get transaction latency statistics
 */
router.get('/latency', (req, res) => {
  try {
    const status = liveLedger.getStatus();
    
    res.json({
      success: true,
      data: {
        latency: status.router.latency,
        config: {
          healingLatencyBound: 24 * 60 * 60 * 1000, // 24 hours
          broadcastInterval: 5000 // 5 seconds
        }
      }
    });
  } catch (error) {
    console.error('Error fetching latency stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * WebSocket endpoint for real-time updates
 * Clients can connect to receive live transaction streams
 */
let websocketClients = new Set();

/**
 * Attach WebSocket server to Express app
 * Call this from your main server setup
 */
export function attachWebSocket(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server, path: '/api/live-ledger/ws' });
  
  wss.on('connection', (ws) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Subscribe to live ledger updates
    const unsubscribe = liveLedger.subscribe(clientId, (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
    
    websocketClients.add({ id: clientId, ws });
    
    console.log(`[WEBSOCKET] Client connected: ${clientId}`);
    
    ws.on('close', () => {
      unsubscribe();
      websocketClients = new Set(
        Array.from(websocketClients).filter(c => c.id !== clientId)
      );
      console.log(`[WEBSOCKET] Client disconnected: ${clientId}`);
    });
    
    ws.on('error', (error) => {
      console.error(`[WEBSOCKET] Error for client ${clientId}:`, error.message);
    });
  });
  
  console.log('[WEBSOCKET] Live Ledger WebSocket server initialized');
}

export default router;
export { liveLedger, attachWebSocket };
