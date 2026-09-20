/**
 * Swarm Orchestrator
 * 
 * Central brain for managing agentic swarms.
 * Uses Legion Protocol to command thousands of agents with minimal processes.
 */

const { LegionCommands, CMD_CODES } = require('../protocol/legion-protocol');
const EventEmitter = require('events');

class SwarmOrchestrator extends EventEmitter {
  constructor(registryUrl) {
    super();
    this.registryUrl = registryUrl;
    this.commands = new LegionCommands();
    this.swarms = new Map(); // swarmId -> { agents, state, goal }
    this.agentRegistry = new Map(); // agentId -> { node, capabilities, status }
  }

  /**
   * Initialize a new swarm
   * @param {string} swarmId - Unique ID for the swarm
   * @param {string} goal - The objective description
   * @param {Object} config - Swarm configuration
   */
  async spawnSwarm(swarmId, goal, config = {}) {
    console.log(`[Orchestrator] Spawning swarm: ${swarmId} for goal: ${goal}`);
    
    const swarm = {
      id: swarmId,
      goal,
      state: 'initializing',
      agents: [],
      createdAt: Date.now(),
      config
    };

    this.swarms.set(swarmId, swarm);

    // Determine required agent types based on goal analysis (simplified)
    const requiredTypes = this.analyzeGoal(goal);
    
    // Broadcast spawn commands via Legion Protocol
    const spawnPackets = [];
    for (const type of requiredTypes) {
      const count = config[type] || 5; // Default 5 agents per type
      const packet = this.commands.spawn(type, count, { swarmId, goal });
      spawnPackets.push(packet);
      
      // Optimistically track agents
      for (let i = 0; i < count; i++) {
        const agentId = `${type}-${swarmId}-${i}`;
        swarm.agents.push(agentId);
        this.agentRegistry.set(agentId, {
          type,
          swarmId,
          status: 'spawning'
        });
      }
    }

    // Emit packets to message bus (simulated here)
    this.emit('broadcast', spawnPackets);
    
    swarm.state = 'active';
    this.emit('swarm:ready', swarmId);
    
    return swarm;
  }

  /**
   * Analyze goal to determine required agent roles
   * In production, this uses LLM planning
   */
  analyzeGoal(goal) {
    const lower = goal.toLowerCase();
    const roles = [];
    
    if (lower.includes('code') || lower.includes('build')) roles.push('coder');
    if (lower.includes('test') || lower.includes('verify')) roles.push('tester');
    if (lower.includes('design') || lower.includes('ui')) roles.push('designer');
    if (lower.includes('research') || lower.includes('search')) roles.push('researcher');
    if (lower.includes('optimize') || lower.includes('speed')) roles.push('optimizer');
    
    // Default fallback
    if (roles.length === 0) roles.push('generalist');
    
    return roles;
  }

  /**
   * Converge swarm towards a new state
   */
  convergeSwarm(swarmId, newState) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);

    console.log(`[Orchestrator] Converging swarm ${swarmId} to: ${newState}`);
    
    const packet = this.commands.converge(newState);
    this.emit('broadcast', [packet]);
    
    swarm.goal = newState;
    this.emit('swarm:converged', swarmId);
  }

  /**
   * Kill specific agents or entire swarm
   */
  killSwarm(swarmId, agentIds = null) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return;

    const targets = agentIds || swarm.agents;
    const packet = this.commands.kill(targets);
    
    this.emit('broadcast', [packet]);
    
    if (!agentIds) {
      swarm.state = 'terminated';
      this.swarms.delete(swarmId);
    } else {
      swarm.agents = swarm.agents.filter(id => !targets.includes(id));
    }
    
    this.emit('swarm:kill', swarmId, targets);
  }

  /**
   * Migrate agents between nodes for load balancing
   */
  migrateAgents(agentIds, fromNode, toNode) {
    const packet = this.commands.migrate(fromNode, toNode, agentIds);
    this.emit('broadcast', [packet]);
    this.emit('agents:migrated', agentIds, fromNode, toNode);
  }

  /**
   * Sync all swarms to a checkpoint
   */
  syncAll(checkpointId) {
    const packet = this.commands.sync(checkpointId);
    this.emit('broadcast', [packet]);
    this.emit('global:sync', checkpointId);
  }

  /**
   * Get swarm status
   */
  getStatus(swarmId) {
    if (swarmId) {
      return this.swarms.get(swarmId);
    }
    return Array.from(this.swarms.values());
  }

  /**
   * Handle incoming agent reports
   */
  handleReport(agentId, metrics) {
    const packet = this.commands.report({ agentId, ...metrics });
    // In real impl, this goes to monitoring dashboard
    this.emit('agent:report', agentId, metrics);
    
    // Auto-scale logic could go here
    if (metrics.load > 0.9) {
      console.warn(`Agent ${agentId} overloaded, consider scaling`);
    }
  }
}

module.exports = { SwarmOrchestrator };
