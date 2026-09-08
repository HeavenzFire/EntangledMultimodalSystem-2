/**
 * VORTEX ARCHITECT INTEGRATION LAYER
 * 
 * Transforms the LiveLedger from linear pipeline to nonlinear swarm topology.
 * Replaces event emitters with attractor fields, resonance states, and metabolic flows.
 * 
 * Core Shifts:
 * - Linear Events → Nonlinear Attractor Fields
 * - Agent Allocation → Resonance-Based Flow Alignment
 * - Fixed Latency Bounds → Metabolic Rhythm Constraints
 * - Hoarding Prevention → Entropy Dissipation Protocol
 * - Transaction Broadcast → Field Coherence Propagation
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ==================== VORTEX CONFIGURATION ====================
const VORTEX_CONFIG = {
  // Attractor field decay rate (how fast unused paths fade)
  ATTRACTOR_DECAY_MS: 300000, // 5 minutes
  
  // Resonance threshold for flow alignment (0-1 scale)
  RESONANCE_THRESHOLD: 0.7,
  
  // Metabolic rhythm bounds (replaces fixed latency)
  METABOLIC_RHYTHM: {
    minCycle: 1000,      // 1 second minimum
    optimalCycle: 60000, // 1 minute optimal
    maxCycle: 86400000   // 24 hours maximum
  },
  
  // Entropy dissipation parameters (replaces hoarding prevention)
  ENTROPY_DISSIPATION: {
    threshold: 0.3,      // Entropy level triggering dissipation
    dissipationRate: 0.1 // Rate per cycle
  },
  
  // Field coherence propagation settings
  COHERENCE_PROPAGATION: {
    broadcastInterval: 2000,
    coherenceDecay: 0.05,
    syncThreshold: 0.8
  }
};

// ==================== NONLINEAR DATA MODELS ====================

/**
 * AttractorField - Represents a state basin that pulls flows toward it
 * Unlike linear events, fields have gradient, depth, and resonance properties
 */
class AttractorField {
  constructor(type, strength = 1.0, metadata = {}) {
    this.id = uuidv4();
    this.type = type; // 'surplus_basin', 'healing_sink', 'coherence_node'
    this.strength = strength; // Field intensity (affects pull radius)
    this.depth = 0; // Accumulated flow volume
    this.gradient = []; // Historical strength changes
    this.resonators = new Set(); // Agents currently resonating with this field
    this.createdAt = Date.now();
    this.lastPulse = Date.now();
    this.metadata = metadata;
    this.status = 'active'; // active → decaying → dormant → dissolved
  }

  /**
   * Add a resonator (agent) to this field
   */
  addResonator(agentId, resonanceLevel = 1.0) {
    this.resonators.add({ agentId, resonanceLevel, joinedAt: Date.now() });
    this.pulse();
  }

  /**
   * Remove a resonator
   */
  removeResonator(agentId) {
    this.resonators = new Set(
      Array.from(this.resonators).filter(r => r.agentId !== agentId)
    );
  }

  /**
   * Pulse the field - increases temporary strength
   */
  pulse(intensity = 0.1) {
    this.strength = Math.min(1.0, this.strength + intensity);
    this.lastPulse = Date.now();
    this.gradient.push({ timestamp: Date.now(), strength: this.strength });
    
    // Keep gradient history manageable
    if (this.gradient.length > 100) {
      this.gradient = this.gradient.slice(-100);
    }
  }

  /**
   * Decay the field over time if not actively used
   */
  decay(decayRate = 0.01) {
    if (this.resonators.size === 0) {
      this.strength = Math.max(0, this.strength - decayRate);
      if (this.strength < 0.1) {
        this.status = 'dormant';
      }
      if (this.strength <= 0) {
        this.status = 'dissolved';
      }
    }
  }

  /**
   * Calculate field resonance score
   */
  getResonanceScore() {
    const resonatorFactor = Math.min(1.0, this.resonators.size / 10);
    const recencyFactor = 1 - Math.min(1, (Date.now() - this.lastPulse) / VORTEX_CONFIG.ATTRACTOR_DECAY_MS);
    return (this.strength * 0.5) + (resonatorFactor * 0.3) + (recencyFactor * 0.2);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      strength: this.strength,
      depth: this.depth,
      resonatorCount: this.resonators.size,
      status: this.status,
      resonanceScore: this.getResonanceScore(),
      lastPulse: this.lastPulse,
      metadata: this.metadata
    };
  }
}

/**
 * FlowState - Represents energy/information moving through the vortex
 * Unlike linear transactions, flows can split, merge, and resonate
 */
class FlowState {
  constructor(source, amount, flowType = 'surplus') {
    this.id = uuidv4();
    this.source = source;
    this.amount = amount;
    this.flowType = flowType; // 'surplus', 'healing', 'coherence', 'entropy'
    this.currentPath = []; // Path of nodes/fields visited
    this.splitHistory = []; // Record of any splits
    this.mergeHistory = []; // Record of any merges
    this.resonanceLevel = 1.0; // How aligned with target attractor
    this.createdAt = Date.now();
    this.lastTransition = Date.now();
    this.status = 'flowing'; // flowing → merged → split → dissipated → anchored
    this.metadata = {};
  }

  /**
   * Split this flow into multiple streams
   */
  split(proportions) {
    if (this.status !== 'flowing') return [];
    
    const totalProportion = proportions.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalProportion - 1.0) > 0.001) {
      throw new Error('Split proportions must sum to 1.0');
    }

    const flows = proportions.map((proportion, idx) => {
      const splitFlow = new FlowState(this.source, this.amount * proportion, this.flowType);
      splitFlow.currentPath = [...this.currentPath, `split-${idx}`];
      splitFlow.mergeHistory = [...this.mergeHistory];
      splitFlow.splitHistory = [...this.splitHistory, { 
        timestamp: Date.now(), 
        parentFlow: this.id, 
        proportion,
        siblingIndex: idx 
      }];
      splitFlow.resonanceLevel = this.resonanceLevel;
      return splitFlow;
    });

    this.status = 'split';
    return flows;
  }

  /**
   * Merge with another flow
   */
  merge(otherFlow) {
    if (this.flowType !== otherFlow.flowType) {
      throw new Error('Can only merge flows of same type');
    }

    const merged = new FlowState(
      `${this.source}+${otherFlow.source}`,
      this.amount + otherFlow.amount,
      this.flowType
    );
    
    merged.currentPath = [...new Set([...this.currentPath, ...otherFlow.currentPath])];
    merged.mergeHistory = [
      ...this.mergeHistory,
      ...otherFlow.mergeHistory,
      { 
        timestamp: Date.now(), 
        flows: [this.id, otherFlow.id],
        combinedAmount: merged.amount 
      }
    ];
    merged.splitHistory = [...this.splitHistory, ...otherFlow.splitHistory];
    merged.resonanceLevel = (this.resonanceLevel + otherFlow.resonanceLevel) / 2;

    this.status = 'merged';
    otherFlow.status = 'merged';

    return merged;
  }

  /**
   * Transition to a new node/field in the vortex
   */
  transition(nodeId, resonanceChange = 0) {
    this.currentPath.push(nodeId);
    this.lastTransition = Date.now();
    this.resonanceLevel = Math.max(0, Math.min(1, this.resonanceLevel + resonanceChange));
    
    if (this.resonanceLevel >= VORTEX_CONFIG.RESONANCE_THRESHOLD) {
      this.status = 'anchored';
    }
  }

  /**
   * Dissipate flow due to entropy
   */
  dissipate(rate = VORTEX_CONFIG.ENTROPY_DISSIPATION.dissipationRate) {
    this.amount = this.amount * (1 - rate);
    this.status = 'dissipated';
    if (this.amount < 1) {
      this.status = 'extinguished';
    }
  }

  toJSON() {
    return {
      id: this.id,
      source: this.source,
      amount: this.amount,
      flowType: this.flowType,
      pathLength: this.currentPath.length,
      currentPath: this.currentPath.slice(-10), // Last 10 nodes
      resonanceLevel: this.resonanceLevel,
      status: this.status,
      splits: this.splitHistory.length,
      merges: this.mergeHistory.length,
      age: Date.now() - this.createdAt
    };
  }
}

/**
 * CoherenceWave - Propagates state synchronization across the vortex
 * Replaces linear broadcast with wave-based field coherence
 */
class CoherenceWave {
  constructor(originNode, waveType = 'sync') {
    this.id = uuidv4();
    this.originNode = originNode;
    this.waveType = waveType; // 'sync', 'alert', 'realignment', 'dissipation'
    this.amplitude = 1.0;
    this.frequency = 1.0;
    this.propagatedNodes = new Set([originNode]);
    this.decayRate = VORTEX_CONFIG.COHERENCE_PROPAGATION.coherenceDecay;
    this.createdAt = Date.now();
    this.lastPropagation = Date.now();
    this.status = 'propagating'; // propagating → dampened → absorbed
  }

  /**
   * Propagate wave to adjacent nodes
   */
  propagate(adjacentNodes) {
    if (this.status !== 'propagating') return [];
    
    const newlyReached = adjacentNodes.filter(n => !this.propagatedNodes.has(n));
    newlyReached.forEach(n => this.propagatedNodes.add(n));
    
    this.amplitude *= (1 - this.decayRate);
    this.lastPropagation = Date.now();
    
    if (this.amplitude < 0.1) {
      this.status = 'dampened';
    }

    return newlyReached;
  }

  /**
   * Get wave coherence impact on a node
   */
  getCoherenceImpact(nodeDistance) {
    const distanceDecay = Math.pow(0.9, nodeDistance);
    return this.amplitude * distanceDecay * this.frequency;
  }

  toJSON() {
    return {
      id: this.id,
      originNode: this.originNode,
      waveType: this.waveType,
      amplitude: this.amplitude,
      propagatedCount: this.propagatedNodes.size,
      status: this.status,
      age: Date.now() - this.createdAt
    };
  }
}

// ==================== VORTEX MODULES ====================

/**
 * SurplusFieldGenerator - Generates attractor fields from surplus sources
 * Replaces SurplusDetector with field-based topology
 */
class SurplusFieldGenerator extends EventEmitter {
  constructor() {
    super();
    this.fields = new Map(); // fieldId -> AttractorField
    this.sources = new Map(); // sourceId -> { type, lastGeneration, totalGenerated }
    this.activeFlows = new Map(); // flowId -> FlowState
    this.fieldHistory = [];
  }

  /**
   * Register a surplus source as a field generator
   */
  registerSource(sourceId, sourceType, config = {}) {
    this.sources.set(sourceId, {
      id: sourceId,
      type: sourceType,
      config,
      lastGeneration: Date.now(),
      totalGenerated: 0,
      active: true
    });

    // Create initial attractor field for this source
    const field = new AttractorField('surplus_basin', 0.5, {
      sourceId,
      sourceType
    });
    
    this.fields.set(field.id, field);
    console.log(`[VORTEX] Generated field ${field.id} for source ${sourceId} (${sourceType})`);
    
    this.emit('field:generated', field);
    return field;
  }

  /**
   * Generate surplus flow from a source
   */
  generateSurplus(sourceId, amount, metadata = {}) {
    const source = this.sources.get(sourceId);
    if (!source || !source.active) {
      console.warn(`[VORTEX] Unknown or inactive source: ${sourceId}`);
      return null;
    }

    // Find or create field for this source
    let field = Array.from(this.fields.values())
      .find(f => f.metadata.sourceId === sourceId && f.status === 'active');
    
    if (!field) {
      field = this.registerSource(sourceId, source.type, source.config);
    }

    // Create flow state
    const flow = new FlowState(sourceId, amount, 'surplus');
    flow.currentPath = [sourceId];
    flow.metadata = metadata;
    
    this.activeFlows.set(flow.id, flow);
    source.totalGenerated += amount;
    source.lastGeneration = Date.now();

    // Pulse the field
    field.pulse(Math.min(0.2, amount / 10000));
    field.depth += amount;

    console.log(`[VORTEX] Generated surplus flow ${flow.id}: ${amount} from ${sourceId}`);
    
    this.emit('surplus:generated', { flow, field });
    return { flow, field };
  }

  /**
   * Get all active surplus fields sorted by resonance score
   */
  getActiveFields() {
    return Array.from(this.fields.values())
      .filter(f => f.status === 'active')
      .sort((a, b) => b.getResonanceScore() - a.getResonanceScore());
  }

  /**
   * Get available flows for allocation
   */
  getAvailableFlows() {
    return Array.from(this.activeFlows.values())
      .filter(f => f.status === 'flowing');
  }

  /**
   * Decay unused fields periodically
   */
  decayFields() {
    const now = Date.now();
    for (const field of this.fields.values()) {
      if (now - field.lastPulse > VORTEX_CONFIG.ATTRACTOR_DECAY_MS) {
        field.decay(0.02);
        if (field.status === 'dissolved') {
          this.fields.delete(field.id);
        }
      }
    }
  }

  getStats() {
    const fields = Array.from(this.fields.values());
    const flows = Array.from(this.activeFlows.values());
    
    return {
      totalFields: fields.length,
      activeFields: fields.filter(f => f.status === 'active').length,
      totalFlows: flows.length,
      flowingFlows: flows.filter(f => f.status === 'flowing').length,
      totalSurplusGenerated: flows.reduce((sum, f) => sum + f.amount, 0),
      avgResonanceScore: fields.reduce((sum, f) => sum + f.getResonanceScore(), 0) / (fields.length || 1)
    };
  }
}

/**
 * SwarmResonanceAllocator - Allocates flows based on resonance alignment
 * Replaces HiveAgentAllocator with resonance-based decision making
 */
class SwarmResonanceAllocator extends EventEmitter {
  constructor(fieldGenerator, config = {}) {
    super();
    this.fieldGenerator = fieldGenerator;
    this.config = { ...VORTEX_CONFIG, ...config };
    this.healingSinks = new Map(); // sinkId -> AttractorField
    this.billFlows = new Map(); // billId -> FlowState
    this.allocations = new Map(); // allocationId -> { flows, sinks, timestamp }
    this.swarmAgents = new Set(); // Active resonating agents
  }

  /**
   * Activate swarm agents as resonators
   */
  activateSwarm(count = 5) {
    for (let i = 0; i < count; i++) {
      const agentId = `resonator-${uuidv4().substr(0, 8)}`;
      this.swarmAgents.add(agentId);
    }
    console.log(`[VORTEX] Activated ${count} swarm resonators`);
  }

  /**
   * Add a healing sink (medical bill becomes an attractor)
   */
  addHealingSink(billData) {
    const sink = new AttractorField('healing_sink', 0.8, {
      patientId: billData.patientId,
      provider: billData.provider,
      originalAmount: billData.amount,
      remainingAmount: billData.amount,
      verificationHash: billData.verificationHash
    });

    this.healingSinks.set(sink.id, sink);
    console.log(`[VORTEX] Created healing sink ${sink.id} for ${billData.provider}`);
    
    this.emit('sink:created', sink);
    return sink;
  }

  /**
   * Allocate surplus flows to healing sinks based on resonance
   */
  allocateByResonance(surplusFlow) {
    const sinks = Array.from(this.healingSinks.values())
      .filter(s => s.status === 'active' && s.metadata.remainingAmount > 0);
    
    if (sinks.length === 0) {
      console.warn('[VORTEX] No active healing sinks - flow unaligned');
      this.emit('flow:unaligned', surplusFlow);
      return null;
    }

    // Calculate resonance between flow and each sink
    const resonanceScores = sinks.map(sink => {
      const priorityScore = 1 - (sink.metadata.remainingAmount / sink.metadata.originalAmount);
      const recencyScore = 1 - Math.min(1, (Date.now() - sink.createdAt) / 3600000);
      const resonanceLevel = (priorityScore * 0.6) + (recencyScore * 0.4);
      return { sink, resonanceLevel };
    });

    // Sort by resonance and allocate
    resonanceScores.sort((a, b) => b.resonanceLevel - a.resonanceLevel);
    
    const allocation = {
      id: uuidv4(),
      surplusFlowId: surplusFlow.id,
      timestamp: Date.now(),
      distributions: []
    };

    let remainingAmount = surplusFlow.amount;

    for (const { sink, resonanceLevel } of resonanceScores) {
      if (remainingAmount <= 0 || resonanceLevel < this.config.RESONANCE_THRESHOLD) break;

      const allocateAmount = Math.min(
        remainingAmount,
        sink.metadata.remainingAmount
      );

      allocation.distributions.push({
        sinkId: sink.id,
        patientId: sink.metadata.patientId,
        provider: sink.metadata.provider,
        amount: allocateAmount,
        resonanceLevel
      });

      // Update sink
      sink.metadata.remainingAmount -= allocateAmount;
      sink.depth += allocateAmount;
      
      if (sink.metadata.remainingAmount <= 0) {
        sink.status = 'saturated';
        console.log(`[VORTEX] ✅ Healing sink SATURATED: ${sink.id}`);
      } else {
        sink.pulse(0.1);
      }

      remainingAmount -= allocateAmount;
    }

    this.allocations.set(allocation.id, allocation);
    
    // Mark flow as allocated
    surplusFlow.status = 'allocated';
    this.fieldGenerator.activeFlows.delete(surplusFlow.id);

    console.log(`[VORTEX] Allocated ${surplusFlow.amount} across ${allocation.distributions.length} sinks via resonance`);
    this.emit('allocation:resonant', allocation);

    return allocation;
  }

  /**
   * Get swarm statistics
   */
  getStats() {
    const allocations = Array.from(this.allocations.values());
    const totalAllocated = allocations.reduce((sum, a) =>
      sum + a.distributions.reduce((s, d) => s + d.amount, 0), 0);

    const saturatedSinks = Array.from(this.healingSinks.values())
      .filter(s => s.status === 'saturated').length;

    return {
      swarmAgentCount: this.swarmAgents.size,
      activeSinks: Array.from(this.healingSinks.values()).filter(s => s.status === 'active').length,
      saturatedSinks,
      totalAllocations: allocations.length,
      totalAllocated,
      avgResonanceLevel: allocations.length > 0 
        ? allocations.reduce((sum, a) => 
            sum + a.distributions.reduce((s, d) => s + d.resonanceLevel, 0) / a.distributions.length, 0) / allocations.length
        : 0
    };
  }
}

/**
 * MetabolicRhythmRouter - Routes flows with metabolic timing constraints
 * Replaces LiquidityRouter with organic rhythm-based processing
 */
class MetabolicRhythmRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...VORTEX_CONFIG, ...config };
    this.pendingFlows = [];
    this.completedCycles = [];
    this.rhythmHistory = [];
    this.currentCycleStart = Date.now();
  }

  /**
   * Create a healing cycle from an allocation
   */
  createHealingCycle(allocation, flow) {
    const totalAmount = allocation.distributions.reduce((sum, d) => sum + d.amount, 0);
    
    const cycle = {
      id: uuidv4(),
      allocationId: allocation.id,
      flowId: flow.id,
      amount: totalAmount,
      createdAt: Date.now(),
      expectedCompletion: Date.now() + this.config.METABOLIC_RHYTHM.optimalCycle,
      status: 'metabolizing', // metabolizing → pulsing → completed
      pulses: [],
      coherenceWaves: []
    };

    this.pendingFlows.push(cycle);
    console.log(`[VORTEX] Created healing cycle ${cycle.id} (${totalAmount})`);
    this.emit('cycle:created', cycle);

    return cycle;
  }

  /**
   * Process cycles according to metabolic rhythm
   */
  processMetabolicCycles() {
    const now = Date.now();
    const cycleTime = now - this.currentCycleStart;
    
    // Determine current rhythm phase
    const phase = this.getRhythmPhase(cycleTime);
    
    for (const cycle of this.pendingFlows) {
      if (cycle.status !== 'metabolizing') continue;

      // Check if cycle is within acceptable rhythm bounds
      if (now > cycle.expectedCompletion + this.config.METABOLIC_RHYTHM.maxCycle) {
        console.warn(`[VORTEX] ⚠️ Cycle ${cycle.id} exceeded metabolic bounds`);
        cycle.status = 'delayed';
      }

      // Pulse at optimal rhythm
      if (phase === 'peak' && cycle.pulses.length < 3) {
        this.pulseCycle(cycle);
      }

      // Complete cycle if enough pulses
      if (cycle.pulses.length >= 3) {
        this.completeCycle(cycle);
      }
    }

    // Track rhythm history
    this.rhythmHistory.push({
      timestamp: now,
      phase,
      activeCycles: this.pendingFlows.filter(c => c.status === 'metabolizing').length
    });

    if (this.rhythmHistory.length > 100) {
      this.rhythmHistory = this.rhythmHistory.slice(-100);
    }

    // Start new cycle period
    if (cycleTime > this.config.METABOLIC_RHYTHM.optimalCycle) {
      this.currentCycleStart = now;
    }
  }

  /**
   * Get current rhythm phase
   */
  getRhythmPhase(elapsedTime) {
    const { minCycle, optimalCycle } = this.config.METABOLIC_RHYTHM;
    
    if (elapsedTime < minCycle) return 'refractory';
    if (elapsedTime < optimalCycle * 0.5) return 'building';
    if (elapsedTime < optimalCycle * 0.8) return 'peak';
    return 'release';
  }

  /**
   * Pulse a cycle - propagate coherence wave
   */
  pulseCycle(cycle) {
    const wave = new CoherenceWave(cycle.id, 'sync');
    cycle.pulses.push({
      timestamp: Date.now(),
      wave,
      amplitude: wave.amplitude
    });
    
    cycle.status = 'pulsing';
    console.log(`[VORTEX] 💓 Pulsed cycle ${cycle.id} (amplitude: ${wave.amplitude.toFixed(2)})`);
    this.emit('cycle:pulsed', { cycle, wave });
  }

  /**
   * Complete a healing cycle
   */
  completeCycle(cycle) {
    cycle.status = 'completed';
    cycle.completedAt = Date.now();
    
    this.completedCycles.push(cycle);
    this.pendingFlows = this.pendingFlows.filter(c => c.id !== cycle.id);

    console.log(`[VORTEX] ✅ Healing cycle COMPLETED: ${cycle.id} (${cycle.amount})`);
    this.emit('cycle:completed', cycle);

    return cycle;
  }

  /**
   * Get rhythm statistics
   */
  getRhythmStats() {
    if (this.rhythmHistory.length === 0) {
      return { avgCyclesPerBeat: 0, coherenceScore: 0 };
    }

    const completed = this.completedCycles.length;
    const pending = this.pendingFlows.length;
    const completionRate = completed / (completed + pending || 1);
    
    const avgAmplitude = this.completedCycles.reduce((sum, c) => 
      sum + c.pulses.reduce((s, p) => s + p.amplitude, 0) / (c.pulses.length || 1), 0) / (completed || 1);

    return {
      completedCycles: completed,
      pendingCycles: pending,
      completionRate,
      avgPulseAmplitude: avgAmplitude,
      coherenceScore: avgAmplitude * completionRate,
      currentPhase: this.getRhythmPhase(Date.now() - this.currentCycleStart)
    };
  }
}

/**
 * EntropyDissipator - Prevents stagnation through controlled dissipation
 * Replaces AccountabilityEnforcement with natural entropy management
 */
class EntropyDissipator extends EventEmitter {
  constructor(fieldGenerator, allocator, router) {
    super();
    this.fieldGenerator = fieldGenerator;
    this.allocator = allocator;
    this.router = router;
    this.entropyMeasurements = [];
    this.dissipationEvents = [];
  }

  /**
   * Measure system entropy
   */
  measureEntropy() {
    const unallocatedFlows = this.fieldGenerator.getAvailableFlows().length;
    const inactiveSinks = Array.from(this.allocator.healingSinks.values())
      .filter(s => s.status === 'active' && s.resonators.size === 0).length;
    const stalledCycles = this.router.pendingFlows.filter(c => 
      Date.now() - c.createdAt > VORTEX_CONFIG.METABOLIC_RHYTHM.optimalCycle * 2
    ).length;

    const entropy = (
      (unallocatedFlows * 0.4) +
      (inactiveSinks * 0.3) +
      (stalledCycles * 0.3)
    ) / 10; // Normalize to 0-1 range

    this.entropyMeasurements.push({
      timestamp: Date.now(),
      entropy,
      components: { unallocatedFlows, inactiveSinks, stalledCycles }
    });

    if (this.entropyMeasurements.length > 100) {
      this.entropyMeasurements = this.entropyMeasurements.slice(-100);
    }

    return entropy;
  }

  /**
   * Dissipate entropy if above threshold
   */
  dissipateIfNeeded() {
    const entropy = this.measureEntropy();
    
    if (entropy > VORTEX_CONFIG.ENTROPY_DISSIPATION.threshold) {
      console.warn(`[VORTEX] ⚠️ High entropy detected: ${entropy.toFixed(2)}`);
      
      const event = {
        id: uuidv4(),
        timestamp: Date.now(),
        entropyLevel: entropy,
        actions: []
      };

      // Dissipate stagnant flows
      const availableFlows = this.fieldGenerator.getAvailableFlows();
      for (const flow of availableFlows) {
        if (Date.now() - flow.createdAt > VORTEX_CONFIG.ATTRACTOR_DECAY_MS) {
          flow.dissipate(VORTEX_CONFIG.ENTROPY_DISSIPATION.dissipationRate);
          event.actions.push({
            type: 'FLOW_DISSIPATION',
            flowId: flow.id,
            remainingAmount: flow.amount
          });
        }
      }

      // Revitalize inactive sinks
      for (const sink of this.allocator.healingSinks.values()) {
        if (sink.status === 'active' && sink.resonators.size === 0) {
          sink.pulse(0.3); // Boost to attract resonators
          event.actions.push({
            type: 'SINK_REVITALIZATION',
            sinkId: sink.id,
            newStrength: sink.strength
          });
        }
      }

      this.dissipationEvents.push(event);
      this.emit('entropy:dissipated', event);
    }
  }

  /**
   * Start continuous entropy monitoring
   */
  startMonitoring() {
    setInterval(() => {
      this.dissipateIfNeeded();
    }, VORTEX_CONFIG.ATTRACTOR_DECAY_MS / 2);

    console.log('[VORTEX] Entropy monitoring initialized');
  }

  getStats() {
    const measurements = this.entropyMeasurements;
    const avgEntropy = measurements.length > 0
      ? measurements.reduce((sum, m) => sum + m.entropy, 0) / measurements.length
      : 0;

    return {
      currentEntropy: measurements.length > 0 ? measurements[measurements.length - 1].entropy : 0,
      avgEntropy,
      dissipationEvents: this.dissipationEvents.length,
      totalDissipatedAmount: this.dissipationEvents.reduce((sum, e) =>
        sum + e.actions.reduce((s, a) => 
          s + (a.type === 'FLOW_DISSIPATION' ? a.remainingAmount : 0), 0), 0)
    };
  }
}

/**
 * CoherenceDashboard - Real-time field state visualization
 * Replaces VerificationNodeDashboard with holographic field view
 */
class CoherenceDashboard extends EventEmitter {
  constructor() {
    super();
    this.fieldSnapshots = [];
    this.flowTrails = [];
    this.coherenceWaves = [];
    this.subscribers = new Set();
    this.aggregatedMetrics = {
      totalHealing: 0,
      fieldsActive: 0,
      flowsAligned: 0,
      coherenceScore: 0
    };
  }

  /**
   * Record field state snapshot
   */
  recordSnapshot(fields, flows, waves) {
    const snapshot = {
      timestamp: Date.now(),
      fieldCount: fields.length,
      flowCount: flows.length,
      waveCount: waves.length,
      avgFieldStrength: fields.reduce((sum, f) => sum + f.strength, 0) / (fields.length || 1),
      avgFlowResonance: flows.reduce((sum, f) => sum + f.resonanceLevel, 0) / (flows.length || 1),
      avgWaveAmplitude: waves.reduce((sum, w) => sum + w.amplitude, 0) / (waves.length || 1)
    };

    this.fieldSnapshots.push(snapshot);
    
    if (this.fieldSnapshots.length > 1000) {
      this.fieldSnapshots = this.fieldSnapshots.slice(-1000);
    }

    this.updateMetrics(fields, flows, waves);
    this.broadcastSnapshot(snapshot);

    this.emit('snapshot:recorded', snapshot);
  }

  /**
   * Record completed healing flow
   */
  recordHealing(cycle) {
    this.aggregatedMetrics.totalHealing += cycle.amount;
    this.aggregatedMetrics.flowsAligned++;

    this.flowTrails.push({
      id: cycle.id,
      amount: cycle.amount,
      completedAt: Date.now(),
      pulses: cycle.pulses.length,
      coherenceScore: cycle.pulses.reduce((sum, p) => sum + p.amplitude, 0) / (cycle.pulses.length || 1)
    });

    if (this.flowTrails.length > 500) {
      this.flowTrails = this.flowTrails.slice(-500);
    }

    this.emit('healing:recorded', { id: cycle.id, amount: cycle.amount });
  }

  /**
   * Update aggregated metrics
   */
  updateMetrics(fields, flows, waves) {
    this.aggregatedMetrics.fieldsActive = fields.filter(f => f.status === 'active').length;
    this.aggregatedMetrics.coherenceScore = waves.reduce((sum, w) => sum + w.amplitude, 0) / (waves.length || 1);
  }

  /**
   * Subscribe client to real-time updates
   */
  subscribe(clientId, sendFn) {
    const subscriber = { id: clientId, send: sendFn, subscribedAt: Date.now() };
    this.subscribers.add(subscriber);

    console.log(`[VORTEX] Client subscribed to coherence field: ${clientId}`);

    // Send initial state
    sendFn({
      type: 'INITIAL_COHERENCE',
      metrics: this.aggregatedMetrics,
      recentSnapshots: this.fieldSnapshots.slice(-50),
      recentHealings: this.flowTrails.slice(-20)
    });

    return () => this.unsubscribe(clientId);
  }

  /**
   * Unsubscribe client
   */
  unsubscribe(clientId) {
    this.subscribers = new Set(
      Array.from(this.subscribers).filter(s => s.id !== clientId)
    );
  }

  /**
   * Broadcast to all subscribers
   */
  broadcastSnapshot(snapshot) {
    const message = JSON.stringify({
      type: 'COHERENCE_UPDATE',
      data: snapshot
    });

    for (const subscriber of this.subscribers) {
      try {
        subscriber.send(message);
      } catch (e) {
        console.error(`[VORTEX] Failed to broadcast to ${subscriber.id}:`, e.message);
        this.unsubscribe(subscriber.id);
      }
    }
  }

  /**
   * Get public dashboard data
   */
  getPublicData(limit = 50) {
    return {
      metrics: this.aggregatedMetrics,
      recentSnapshots: this.fieldSnapshots.slice(-limit),
      recentHealings: this.flowTrails.slice(-limit),
      lastUpdated: Date.now()
    };
  }
}

// ==================== MAIN VORTEX SYSTEM ====================

/**
 * VortexLedgerSystem - Main orchestration class for nonlinear ledger topology
 */
class VortexLedgerSystem {
  constructor(config = {}) {
    this.config = { ...VORTEX_CONFIG, ...config };

    // Initialize vortex modules
    this.fieldGenerator = new SurplusFieldGenerator();
    this.allocator = new SwarmResonanceAllocator(this.fieldGenerator, this.config);
    this.router = new MetabolicRhythmRouter(this.config);
    this.entropyDissipator = new EntropyDissipator(
      this.fieldGenerator,
      this.allocator,
      this.router
    );
    this.dashboard = new CoherenceDashboard();

    // Wire vortex event pipeline
    this.wireVortexPipeline();

    // Start metabolic rhythm loop
    this.startMetabolicLoop();

    // Start entropy monitoring
    this.entropyDissipator.startMonitoring();

    console.log('[VORTEX] Nonlinear Ledger System initialized');
    console.log('[VORTEX] Topology: Attractor Fields → Resonance Flows → Metabolic Cycles → Coherence Waves');
  }

  /**
   * Wire event pipeline between vortex modules
   */
  wireVortexPipeline() {
    // Surplus generation → Field creation
    this.fieldGenerator.on('surplus:generated', ({ flow, field }) => {
      console.log(`[VORTEX] Flow ${flow.id} generated in field ${field.id}`);
    });

    // Allocation → Create healing cycle
    this.allocator.on('allocation:resonant', (allocation) => {
      const flow = { id: allocation.surplusFlowId, amount: allocation.distributions.reduce((s, d) => s + d.amount, 0) };
      const cycle = this.router.createHealingCycle(allocation, flow);

      // When cycle completes, record to dashboard
      this.router.once('cycle:completed', (completedCycle) => {
        this.dashboard.recordHealing(completedCycle);
      });
    });

    // Cycle pulsing → Record coherence waves
    this.router.on('cycle:pulsed', ({ cycle, wave }) => {
      this.dashboard.recordSnapshot(
        this.fieldGenerator.getActiveFields(),
        this.fieldGenerator.getAvailableFlows(),
        [wave]
      );
    });
  }

  /**
   * Start metabolic rhythm processing loop
   */
  startMetabolicLoop() {
    setInterval(() => {
      this.router.processMetabolicCycles();
      this.fieldGenerator.decayFields();
    }, this.config.COHERENCE_PROPAGATION.broadcastInterval);

    console.log(`[VORTEX] Metabolic rhythm loop started (interval: ${this.config.COHERENCE_PROPAGATION.broadcastInterval}ms)`);
  }

  // ==================== PUBLIC API ====================

  /**
   * Register a surplus source
   */
  registerSource(sourceId, sourceType, config = {}) {
    return this.fieldGenerator.registerSource(sourceId, sourceType, config);
  }

  /**
   * Generate surplus flow
   */
  generateSurplus(sourceId, amount, metadata = {}) {
    return this.fieldGenerator.generateSurplus(sourceId, amount, metadata);
  }

  /**
   * Add a healing sink (medical bill)
   */
  addHealingSink(patientId, provider, amount, verificationHash) {
    return this.allocator.addHealingSink({
      patientId,
      provider,
      amount,
      verificationHash
    });
  }

  /**
   * Activate swarm resonators
   */
  activateSwarm(count = 5) {
    this.allocator.activateSwarm(count);
  }

  /**
   * Get comprehensive system status
   */
  getStatus() {
    return {
      fields: this.fieldGenerator.getStats(),
      swarm: this.allocator.getStats(),
      rhythm: this.router.getRhythmStats(),
      entropy: this.entropyDissipator.getStats(),
      dashboard: this.dashboard.getPublicData(10)
    };
  }

  /**
   * Get public coherence data
   */
  getPublicCoherenceData(limit = 100) {
    return this.dashboard.getPublicData(limit);
  }

  /**
   * Subscribe to coherence updates
   */
  subscribe(clientId, sendFn) {
    return this.dashboard.subscribe(clientId, sendFn);
  }
}

// ==================== EXPORTS ====================

export {
  VortexLedgerSystem,
  SurplusFieldGenerator,
  SwarmResonanceAllocator,
  MetabolicRhythmRouter,
  EntropyDissipator,
  CoherenceDashboard,
  AttractorField,
  FlowState,
  CoherenceWave,
  VORTEX_CONFIG
};

export default VortexLedgerSystem;
