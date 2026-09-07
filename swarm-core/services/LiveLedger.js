/**
 * Live Ledger Broadcast Module
 * 
 * Real-time surplus-to-healing pipeline for the Sovereign Care Protocol.
 * Streams proof of medical debt payments and healing transactions to public verification nodes.
 * 
 * Core Flow:
 * 1. Surplus Detection → Grid stabilization, compute efficiency, syntropic yield
 * 2. Agentic Allocation → Hive agents assign surplus to verified medical bills
 * 3. Ledger Broadcast → Transactions published to Live Ledger (visible to public)
 * 4. Automatic Enforcement → Idle surplus redistributed instantly beyond threshold
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Latency bound for healing transactions (<24h default)
  HEALING_LATENCY_MS: 24 * 60 * 60 * 1000,
  
  // Idle threshold before automatic redistribution (1 hour)
  IDLE_THRESHOLD_MS: 60 * 60 * 1000,
  
  // Minimum surplus amount to trigger allocation
  MIN_SURPLUS_THRESHOLD: 100, // in base currency units
  
  // Verification node broadcast interval (seconds)
  BROADCAST_INTERVAL: 5000,
  
  // Maximum transactions per batch
  MAX_BATCH_SIZE: 100
};

// ==================== DATA MODELS ====================

/**
 * SurplusEvent - Represents detected surplus from any source
 */
class SurplusEvent {
  constructor(source, amount, metadata = {}) {
    this.id = uuidv4();
    this.source = source; // 'grid_stabilization', 'compute_efficiency', 'syntropic_yield'
    this.amount = amount;
    this.timestamp = Date.now();
    this.metadata = metadata;
    this.status = 'detected'; // detected → allocated → routed → healed
    this.allocationId = null;
  }

  toJSON() {
    return {
      id: this.id,
      source: this.source,
      amount: this.amount,
      timestamp: this.timestamp,
      status: this.status,
      allocationId: this.allocationId,
      metadata: this.metadata
    };
  }
}

/**
 * MedicalBill - Verified patient medical debt
 */
class MedicalBill {
  constructor(patientId, provider, amount, verificationHash) {
    this.id = uuidv4();
    this.patientId = patientId; // Hashed for privacy
    this.provider = provider;
    this.amount = amount;
    this.remainingAmount = amount;
    this.verificationHash = verificationHash; // Cryptographic proof of validity
    this.submittedAt = Date.now();
    this.status = 'pending'; // pending → partially_paid → paid → rejected
    this.paymentHistory = [];
  }

  toJSON() {
    return {
      id: this.id,
      patientId: this.patientId,
      provider: this.provider,
      amount: this.amount,
      remainingAmount: this.remainingAmount,
      verificationHash: this.verificationHash,
      submittedAt: this.submittedAt,
      status: this.status,
      paymentHistory: this.paymentHistory
    };
  }
}

/**
 * HealingTransaction - A completed surplus → healing flow
 */
class HealingTransaction {
  constructor(surplusEvents, medicalBills, amount) {
    this.id = uuidv4();
    this.surplusEventIds = surplusEvents.map(s => s.id);
    this.billIds = medicalBills.map(b => b.id);
    this.amount = amount;
    this.timestamp = Date.now();
    this.status = 'broadcast'; // pending → broadcast → confirmed → verified
    this.transactionHash = null; // Blockchain/ledger hash
    this.publicUrl = null; // URL to public verification
    this.confirmations = 0;
  }

  toJSON() {
    return {
      id: this.id,
      surplusEventIds: this.surplusEventIds,
      billIds: this.billIds,
      amount: this.amount,
      timestamp: this.timestamp,
      status: this.status,
      transactionHash: this.transactionHash,
      publicUrl: this.publicUrl,
      confirmations: this.confirmations
    };
  }
}

// ==================== CORE MODULES ====================

/**
 * SurplusDetector - Monitors various sources for measurable surplus
 */
class SurplusDetector extends EventEmitter {
  constructor() {
    super();
    this.surplusPool = [];
    this.totalDetected = 0;
    this.sources = new Map(); // Track surplus by source type
  }

  /**
   * Register a surplus source (grid, compute, yield, etc.)
   */
  registerSource(sourceId, sourceType, config = {}) {
    this.sources.set(sourceId, {
      id: sourceId,
      type: sourceType,
      config,
      lastReport: Date.now(),
      active: true
    });
    console.log(`[SURPLUS] Registered source: ${sourceId} (${sourceType})`);
  }

  /**
   * Report surplus from a registered source
   */
  reportSurplus(sourceId, amount, metadata = {}) {
    const source = this.sources.get(sourceId);
    if (!source || !source.active) {
      console.warn(`[SURPLUS] Unknown or inactive source: ${sourceId}`);
      return null;
    }

    const event = new SurplusEvent(source.type, amount, {
      ...metadata,
      sourceId
    });

    this.surplusPool.push(event);
    this.totalDetected += amount;
    source.lastReport = Date.now();

    // Update source-specific tracking
    if (!source.total) source.total = 0;
    source.total += amount;

    console.log(`[SURPLUS] Detected ${amount} from ${sourceId} (${source.type})`);
    
    // Emit for listeners (hive agents, allocator, etc.)
    this.emit('surplus:detected', event);
    
    return event;
  }

  /**
   * Get available surplus for allocation
   */
  getAvailableSurplus() {
    return this.surplusPool.filter(s => s.status === 'detected');
  }

  /**
   * Mark surplus as allocated
   */
  markAllocated(surplusId, allocationId) {
    const event = this.surplusPool.find(s => s.id === surplusId);
    if (event) {
      event.status = 'allocated';
      event.allocationId = allocationId;
      this.emit('surplus:allocated', event);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      totalDetected: this.totalDetected,
      available: this.getAvailableSurplus().reduce((sum, s) => sum + s.amount, 0),
      sourceCount: this.sources.size,
      bySource: {}
    };

    for (const [id, source] of this.sources) {
      stats.bySource[source.type] = (stats.bySource[source.type] || 0) + (source.total || 0);
    }

    return stats;
  }
}

/**
 * HiveAgentAllocator - Autonomous agents that scan and allocate surplus to medical bills
 */
class HiveAgentAllocator extends EventEmitter {
  constructor(surplusDetector, verificationNodes) {
    super();
    this.surplusDetector = surplusDetector;
    this.verificationNodes = verificationNodes;
    this.billQueue = [];
    this.allocations = new Map();
    this.agentCount = 0;
    
    // Listen for surplus events
    this.surplusDetector.on('surplus:detected', (event) => {
      this.processSurplus(event);
    });
  }

  /**
   * Activate hive agents
   */
  activateAgents(count = 5) {
    this.agentCount = count;
    console.log(`[HIVE] Activated ${count} autonomous allocation agents`);
  }

  /**
   * Add verified medical bills to the queue
   */
  addMedicalBill(bill) {
    this.billQueue.push(bill);
    console.log(`[HIVE] Added medical bill: ${bill.id} (${bill.amount})`);
    this.emit('bill:added', bill);
  }

  /**
   * Process detected surplus - allocate to highest priority bills
   */
  processSurplus(surplusEvent) {
    if (this.billQueue.length === 0) {
      console.warn('[HIVE] No bills to allocate - surplus idle');
      this.emit('surplus:idle', surplusEvent);
      return;
    }

    // Priority: oldest bills first, then by amount (smaller first for max impact)
    const sortedBills = [...this.billQueue]
      .filter(b => b.status === 'pending' && b.remainingAmount > 0)
      .sort((a, b) => {
        if (a.submittedAt !== b.submittedAt) return a.submittedAt - b.submittedAt;
        return a.remainingAmount - b.remainingAmount;
      });

    if (sortedBills.length === 0) {
      console.warn('[HIVE] No pending bills - surplus idle');
      this.emit('surplus:idle', surplusEvent);
      return;
    }

    // Allocate surplus to bills
    const allocation = {
      id: uuidv4(),
      surplusEventId: surplusEvent.id,
      timestamp: Date.now(),
      distributions: []
    };

    let remainingSurplus = surplusEvent.amount;

    for (const bill of sortedBills) {
      if (remainingSurplus <= 0) break;

      const allocateAmount = Math.min(remainingSurplus, bill.remainingAmount);
      
      allocation.distributions.push({
        billId: bill.id,
        patientId: bill.patientId,
        provider: bill.provider,
        amount: allocateAmount
      });

      // Update bill
      bill.remainingAmount -= allocateAmount;
      bill.paymentHistory.push({
        amount: allocateAmount,
        timestamp: Date.now(),
        surplusEventId: surplusEvent.id,
        allocationId: allocation.id
      });

      // Update bill status
      if (bill.remainingAmount <= 0) {
        bill.status = 'paid';
        console.log(`[HIVE] ✅ Bill PAID: ${bill.id} for ${bill.patientId}`);
      } else {
        bill.status = 'partially_paid';
      }

      remainingSurplus -= allocateAmount;
    }

    this.allocations.set(allocation.id, allocation);
    this.surplusDetector.markAllocated(surplusEvent.id, allocation.id);

    console.log(`[HIVE] Allocated ${surplusEvent.amount} across ${allocation.distributions.length} bills`);
    this.emit('allocation:created', allocation);

    return allocation;
  }

  /**
   * Get allocation statistics
   */
  getStats() {
    const allocations = Array.from(this.allocations.values());
    const totalAllocated = allocations.reduce((sum, a) => 
      sum + a.distributions.reduce((s, d) => s + d.amount, 0), 0);
    
    const billsPaid = this.billQueue.filter(b => b.status === 'paid').length;
    const totalPatientsHelped = new Set(
      this.billQueue.filter(b => b.status === 'paid').map(b => b.patientId)
    ).size;

    return {
      agentCount: this.agentCount,
      totalAllocations: allocations.length,
      totalAllocated,
      billsInQueue: this.billQueue.length,
      billsPaid,
      patientsHelped: totalPatientsHelped,
      pendingAmount: this.billQueue
        .filter(b => b.status !== 'rejected')
        .reduce((sum, b) => sum + b.remainingAmount, 0)
    };
  }
}

/**
 * LiquidityRouter - Converts allocations into healing transactions within latency bounds
 */
class LiquidityRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...CONFIG, ...config };
    this.pendingTransactions = [];
    this.completedTransactions = [];
    this.latencyMetrics = [];
  }

  /**
   * Create healing transaction from allocation
   */
  createTransaction(allocation, surplusEvents) {
    const totalAmount = allocation.distributions.reduce((sum, d) => sum + d.amount, 0);
    
    const transaction = new HealingTransaction(
      surplusEvents,
      allocation.distributions.map(d => ({ 
        id: d.billId, 
        patientId: d.patientId,
        provider: d.provider,
        amount: d.amount 
      })),
      totalAmount
    );

    this.pendingTransactions.push({
      transaction,
      allocation,
      createdAt: Date.now(),
      deadline: Date.now() + this.config.HEALING_LATENCY_MS
    });

    console.log(`[ROUTER] Created healing transaction: ${transaction.id} (${totalAmount})`);
    this.emit('transaction:created', transaction);

    return transaction;
  }

  /**
   * Process pending transactions - simulate blockchain/ledger broadcast
   */
  async processPendingTransactions() {
    const now = Date.now();
    const toProcess = this.pendingTransactions.filter(
      p => p.transaction.status === 'broadcast'
    );

    for (const pending of toProcess) {
      // Check latency deadline
      if (now > pending.deadline) {
        console.warn(`[ROUTER] ⚠️ Transaction ${pending.transaction.id} exceeded latency bound`);
        this.emit('transaction:latency_exceeded', pending.transaction);
      }

      // Simulate broadcast to ledger
      await this.broadcastToLedger(pending.transaction);
    }
  }

  /**
   * Broadcast transaction to public ledger
   */
  async broadcastToLedger(transaction) {
    // Simulate ledger broadcast (in production, integrate with actual blockchain/ledger)
    transaction.status = 'broadcast';
    transaction.transactionHash = this.generateTransactionHash(transaction);
    transaction.publicUrl = `/ledger/tx/${transaction.transactionHash}`;

    this.completedTransactions.push(transaction);
    this.pendingTransactions = this.pendingTransactions.filter(
      p => p.transaction.id !== transaction.id
    );

    // Calculate latency
    const latency = Date.now() - transaction.timestamp;
    this.latencyMetrics.push(latency);

    console.log(`[ROUTER] 📡 Broadcast to ledger: ${transaction.transactionHash}`);
    this.emit('transaction:broadcast', transaction);

    return transaction;
  }

  /**
   * Generate mock transaction hash (replace with real crypto in production)
   */
  generateTransactionHash(transaction) {
    const data = JSON.stringify({
      id: transaction.id,
      timestamp: transaction.timestamp,
      amount: transaction.amount
    });
    
    // Simple hash simulation (use SHA-256 in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  }

  /**
   * Confirm transaction on ledger
   */
  confirmTransaction(transactionId, confirmations = 1) {
    const transaction = this.completedTransactions.find(t => t.id === transactionId);
    if (transaction) {
      transaction.confirmations += confirmations;
      transaction.status = transaction.confirmations >= 3 ? 'verified' : 'confirmed';
      console.log(`[ROUTER] ✅ Transaction confirmed (${transaction.confirmations}): ${transactionId}`);
      this.emit('transaction:confirmed', transaction);
    }
  }

  /**
   * Get latency statistics
   */
  getLatencyStats() {
    if (this.latencyMetrics.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
    
    const sum = this.latencyMetrics.reduce((a, b) => a + b, 0);
    return {
      avg: sum / this.latencyMetrics.length,
      min: Math.min(...this.latencyMetrics),
      max: Math.max(...this.latencyMetrics),
      count: this.latencyMetrics.length,
      withinBound: this.latencyMetrics.filter(l => l <= CONFIG.HEALING_LATENCY_MS).length
    };
  }
}

/**
 * AccountabilityEnforcement - Ensures no surplus leakage or hoarding
 */
class AccountabilityEnforcement extends EventEmitter {
  constructor(surplusDetector, allocator, router) {
    super();
    this.surplusDetector = surplusDetector;
    this.allocator = allocator;
    this.router = router;
    this.violations = [];
    this.enforcementActions = [];

    // Start monitoring loop
    this.startMonitoring();
  }

  /**
   * Start continuous monitoring for idle surplus
   */
  startMonitoring() {
    setInterval(() => {
      this.checkIdleSurplus();
    }, CONFIG.IDLE_THRESHOLD_MS / 2);

    console.log('[ACCOUNTABILITY] Monitoring started - checking for idle surplus');
  }

  /**
   * Check for surplus that has been idle beyond threshold
   */
  checkIdleSurplus() {
    const availableSurplus = this.surplusDetector.getAvailableSurplus();
    const now = Date.now();

    for (const event of availableSurplus) {
      const idleTime = now - event.timestamp;
      
      if (idleTime > CONFIG.IDLE_THRESHOLD_MS && event.amount >= CONFIG.MIN_SURPLUS_THRESHOLD) {
        this.handleIdleSurplus(event, idleTime);
      }
    }
  }

  /**
   * Handle idle surplus - force redistribution
   */
  handleIdleSurplus(surplusEvent, idleTime) {
    console.warn(`[ACCOUNTABILITY] ⚠️ Idle surplus detected: ${surplusEvent.id} (${surplusEvent.amount}) idle for ${idleTime}ms`);

    // Record violation
    const violation = {
      id: uuidv4(),
      type: 'IDLE_SURPLUS',
      surplusEventId: surplusEvent.id,
      amount: surplusEvent.amount,
      idleTime,
      timestamp: Date.now()
    };
    this.violations.push(violation);

    // Force immediate allocation to emergency fund or highest priority bills
    this.enforceRedistribution(surplusEvent);

    this.emit('enforcement:action', violation);
  }

  /**
   * Enforce immediate redistribution of idle surplus
   */
  enforceRedistribution(surplusEvent) {
    console.log(`[ACCOUNTABILITY] 🔨 Enforcing redistribution of ${surplusEvent.amount}`);

    // Trigger allocation manually
    const allocation = this.allocator.processSurplus(surplusEvent);
    
    if (!allocation) {
      // If no bills available, route to emergency community fund
      console.log('[ACCOUNTABILITY] No bills available - routing to emergency fund');
      this.routeToEmergencyFund(surplusEvent);
    }

    const action = {
      id: uuidv4(),
      violationId: this.violations[this.violations.length - 1]?.id,
      surplusEventId: surplusEvent.id,
      action: 'FORCED_REDISTRIBUTION',
      timestamp: Date.now(),
      result: allocation ? 'ALLOCATED' : 'EMERGENCY_FUND'
    };

    this.enforcementActions.push(action);
    this.emit('enforcement:completed', action);
  }

  /**
   * Route to emergency community fund (fallback)
   */
  routeToEmergencyFund(surplusEvent) {
    surplusEvent.status = 'emergency_routed';
    surplusEvent.metadata.emergencyFund = true;
    console.log(`[ACCOUNTABILITY] Routed ${surplusEvent.amount} to emergency fund`);
  }

  /**
   * Get enforcement statistics
   */
  getStats() {
    return {
      violationsCount: this.violations.length,
      enforcementActionsCount: this.enforcementActions.length,
      totalEnforcedAmount: this.enforcementActions
        .filter(a => a.action === 'FORCED_REDISTRIBUTION')
        .reduce((sum, a) => {
          const event = this.surplusDetector.surplusPool.find(s => s.id === a.surplusEventId);
          return sum + (event?.amount || 0);
        }, 0),
      recentViolations: this.violations.slice(-10)
    };
  }
}

/**
 * VerificationNodeDashboard - Public-facing dashboard for real-time verification
 */
class VerificationNodeDashboard extends EventEmitter {
  constructor() {
    super();
    this.transactionStream = [];
    this.aggregatedStats = {
      totalHealing: 0,
      totalPatientsHelped: 0,
      totalBillsPaid: 0,
      activeSources: 0,
      avgLatency: 0
    };
    this.subscribers = new Set(); // WebSocket clients
  }

  /**
   * Record transaction for public viewing
   */
  recordTransaction(transaction) {
    const publicRecord = {
      id: transaction.id,
      hash: transaction.transactionHash,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      status: transaction.status,
      confirmations: transaction.confirmations,
      // Privacy-preserving: only show aggregated patient data
      billCount: transaction.billIds.length,
      anonymized: true
    };

    this.transactionStream.push(publicRecord);
    
    // Keep only recent transactions in memory
    if (this.transactionStream.length > 1000) {
      this.transactionStream = this.transactionStream.slice(-1000);
    }

    // Update aggregated stats
    this.updateStats(transaction);

    // Broadcast to subscribers
    this.broadcastToSubscribers(publicRecord);

    console.log(`[DASHBOARD] Recorded healing transaction: ${publicRecord.hash}`);
    this.emit('transaction:recorded', publicRecord);
  }

  /**
   * Update aggregated statistics
   */
  updateStats(transaction) {
    if (transaction.status === 'verified') {
      this.aggregatedStats.totalHealing += transaction.amount;
      this.aggregatedStats.totalBillsPaid += transaction.billCount;
      // Estimate unique patients (would need deduplication in production)
      this.aggregatedStats.totalPatientsHelped += Math.ceil(transaction.billCount * 0.7);
    }
  }

  /**
   * Subscribe a client to real-time updates
   */
  subscribe(clientId, sendFn) {
    this.subscribers.add({ id: clientId, send: sendFn });
    console.log(`[DASHBOARD] Client subscribed: ${clientId}`);
    
    // Send initial state
    sendFn({
      type: 'INITIAL_STATE',
      stats: this.aggregatedStats,
      recentTransactions: this.transactionStream.slice(-50)
    });

    return () => this.unsubscribe(clientId);
  }

  /**
   * Unsubscribe a client
   */
  unsubscribe(clientId) {
    this.subscribers = new Set(
      Array.from(this.subscribers).filter(s => s.id !== clientId)
    );
  }

  /**
   * Broadcast to all connected subscribers
   */
  broadcastToSubscribers(data) {
    const message = JSON.stringify({
      type: 'NEW_TRANSACTION',
      data
    });

    for (const subscriber of this.subscribers) {
      try {
        subscriber.send(message);
      } catch (e) {
        console.error(`[DASHBOARD] Failed to send to ${subscriber.id}:`, e.message);
        this.unsubscribe(subscriber.id);
      }
    }
  }

  /**
   * Get public API response data
   */
  getPublicData(limit = 100) {
    return {
      stats: this.aggregatedStats,
      recentTransactions: this.transactionStream.slice(-limit),
      lastUpdated: Date.now()
    };
  }

  /**
   * Get detailed transaction by hash
   */
  getTransactionByHash(hash) {
    return this.transactionStream.find(t => t.hash === hash) || null;
  }
}

// ==================== MAIN LIVE LEDGER SYSTEM ====================

/**
 * LiveLedgerSystem - Main orchestration class tying all modules together
 */
class LiveLedgerSystem {
  constructor(config = {}) {
    this.config = { ...CONFIG, ...config };
    
    // Initialize core modules
    this.surplusDetector = new SurplusDetector();
    this.verificationDashboard = new VerificationNodeDashboard();
    this.allocator = new HiveAgentAllocator(this.surplusDetector, this.verificationDashboard);
    this.router = new LiquidityRouter(this.config);
    this.accountability = new AccountabilityEnforcement(
      this.surplusDetector,
      this.allocator,
      this.router
    );

    // Wire up event pipelines
    this.wireEventPipeline();
    
    // Start broadcast loop
    this.startBroadcastLoop();

    console.log('[LIVE_LEDGER] Sovereign Care Protocol initialized');
    console.log('[LIVE_LEDGER] Modules: SurplusDetector, HiveAllocator, LiquidityRouter, AccountabilityEnforcement, VerificationDashboard');
  }

  /**
   * Wire event pipeline between modules
   */
  wireEventPipeline() {
    // Allocation → Router
    this.allocator.on('allocation:created', (allocation) => {
      const surplusEvents = allocation.distributions.map(() => {
        // Find the original surplus event
        return this.surplusDetector.surplusPool.find(
          s => s.id === allocation.surplusEventId
        );
      }).filter(Boolean);

      if (surplusEvents.length > 0) {
        const tx = this.router.createTransaction(allocation, surplusEvents);
        
        // When transaction is broadcast, record to dashboard
        this.router.once('transaction:broadcast', (broadcastTx) => {
          this.verificationDashboard.recordTransaction(broadcastTx);
        });
      }
    });

    // Transaction confirmation → Update dashboard stats
    this.router.on('transaction:confirmed', (tx) => {
      this.verificationDashboard.recordTransaction(tx); // Re-record with updated status
    });

    // Accountability actions → Log and broadcast
    this.accountability.on('enforcement:action', (violation) => {
      console.log(`[LIVE_LEDGER] Enforcement action recorded: ${violation.id}`);
    });
  }

  /**
   * Start periodic broadcast loop
   */
  startBroadcastLoop() {
    setInterval(async () => {
      await this.router.processPendingTransactions();
    }, this.config.BROADCAST_INTERVAL);

    console.log(`[LIVE_LEDGER] Broadcast loop started (interval: ${this.config.BROADCAST_INTERVAL}ms)`);
  }

  // ==================== PUBLIC API ====================

  /**
   * Register a surplus source
   */
  registerSurplusSource(sourceId, sourceType, config = {}) {
    return this.surplusDetector.registerSource(sourceId, sourceType, config);
  }

  /**
   * Report surplus from a source
   */
  reportSurplus(sourceId, amount, metadata = {}) {
    return this.surplusDetector.reportSurplus(sourceId, amount, metadata);
  }

  /**
   * Add a verified medical bill
   */
  addMedicalBill(patientId, provider, amount, verificationHash) {
    const bill = new MedicalBill(patientId, provider, amount, verificationHash);
    this.allocator.addMedicalBill(bill);
    return bill;
  }

  /**
   * Activate hive agents
   */
  activateHiveAgents(count = 5) {
    this.allocator.activateAgents(count);
  }

  /**
   * Get comprehensive system status
   */
  getStatus() {
    return {
      surplus: this.surplusDetector.getStats(),
      allocator: this.allocator.getStats(),
      router: {
        pendingTransactions: this.router.pendingTransactions.length,
        completedTransactions: this.router.completedTransactions.length,
        latency: this.router.getLatencyStats()
      },
      accountability: this.accountability.getStats(),
      dashboard: this.verificationDashboard.getPublicData(10)
    };
  }

  /**
   * Get public dashboard data (for API)
   */
  getPublicDashboard(limit = 100) {
    return this.verificationDashboard.getPublicData(limit);
  }

  /**
   * Get transaction by hash (for API)
   */
  getTransactionByHash(hash) {
    return this.verificationDashboard.getTransactionByHash(hash);
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(clientId, sendFn) {
    return this.verificationDashboard.subscribe(clientId, sendFn);
  }
}

// ==================== EXPORTS ====================

export {
  LiveLedgerSystem,
  SurplusDetector,
  HiveAgentAllocator,
  LiquidityRouter,
  AccountabilityEnforcement,
  VerificationNodeDashboard,
  SurplusEvent,
  MedicalBill,
  HealingTransaction,
  CONFIG
};

// Default export
export default LiveLedgerSystem;
