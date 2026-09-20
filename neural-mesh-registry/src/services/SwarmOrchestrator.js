/**
 * Agentic Swarm Orchestrator Service
 * Manages legion-scale swarms with high-radix command compression
 */

import { v4 as uuidv4 } from 'uuid';
import { createLegionPacket, LegionOpcode, codec } from '../utils/HighRadixCodec.js';

class SwarmOrchestrator {
  constructor() {
    this.swarms = new Map();
    this.agents = new Map();
    this.metrics = {
      totalSwarms: 0,
      activeAgents: 0,
      tasksCompleted: 0,
      avgCompletionTime: 0,
      compressionRatio: 20.0
    };
  }

  /**
   * Spawn a new swarm with specified agent count
   */
  spawnSwarm(name, agentCount, availableNeurons) {
    const swarmId = uuidv4();
    const agents = [];

    // Select neurons for this swarm
    const selectedNeurons = availableNeurons.slice(0, agentCount);
    
    for (const neuron of selectedNeurons) {
      const agent = {
        id: uuidv4(),
        neuronId: neuron.id,
        role: this.assignRole(neuron.capabilities),
        status: 'idle',
        capabilities: neuron.capabilities,
        lastHeartbeat: Date.now()
      };
      agents.push(agent);
      this.agents.set(agent.id, agent);
    }

    const swarm = {
      id: swarmId,
      name,
      agents,
      taskQueue: [],
      status: 'active',
      createdAt: Date.now()
    };

    this.swarms.set(swarmId, swarm);
    this.metrics.totalSwarms++;
    this.metrics.activeAgents += agents.length;

    // Create compressed SPAWN command
    const spawnCommand = this.createCompressedCommand(
      LegionOpcode.SPAWN,
      swarmId,
      { agentCount, timestamp: Date.now() }
    );

    console.log(`[SWARM] Spawned "${name}" with ${agents.length} agents`);
    console.log(`[COMPRESSION] Spawn command: ${spawnCommand.originalSize} → ${spawnCommand.encodedSize} bytes (${spawnCommand.reductionPercent}% reduction)`);

    return swarm;
  }

  /**
   * Assign role based on capabilities
   */
  assignRole(capabilities) {
    if (capabilities.includes('generate')) return 'generator';
    if (capabilities.includes('evaluate')) return 'evaluator';
    if (capabilities.includes('route')) return 'router';
    if (capabilities.includes('analyze')) return 'analyst';
    if (capabilities.includes('execute')) return 'executor';
    return 'worker';
  }

  /**
   * Dispatch task to swarm using consensus bidding
   */
  dispatchTask(swarmId, taskType, payload) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);

    const task = {
      id: uuidv4(),
      type: taskType,
      payload,
      status: 'pending'
    };

    // Simple bidding: assign to first idle agent
    const idleAgent = swarm.agents.find(a => a.status === 'idle');
    if (idleAgent) {
      task.assignedAgent = idleAgent.id;
      task.status = 'running';
      idleAgent.status = 'busy';
    }

    swarm.taskQueue.push(task);

    // Create compressed task command
    const taskCommand = this.createCompressedCommand(
      LegionOpcode.BROADCAST,
      swarmId,
      { taskId: task.id, type: taskType, payload }
    );

    console.log(`[TASK] Dispatched ${taskType} to swarm ${swarm.name}`);
    
    return task.id;
  }

  /**
   * Converge swarm results
   */
  convergeSwarm(swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);

    swarm.status = 'converging';

    const completedTasks = swarm.taskQueue.filter(t => t.status === 'completed');
    const results = completedTasks.map(t => t.result);

    // Send CONVERGE command
    const convergeCommand = this.createCompressedCommand(
      LegionOpcode.CONVERGE,
      swarmId,
      { resultCount: results.length, timestamp: Date.now() }
    );

    console.log(`[CONVERGE] Swarm ${swarm.name} converged ${results.length} results`);

    return results;
  }

  /**
   * Diverge swarm into sub-swarms
   */
  divergeSwarm(swarmId, subSwarmCount) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);

    swarm.status = 'diverging';
    const subSwarmIds = [];

    // Split agents into sub-swarms
    const agentsPerSwarm = Math.floor(swarm.agents.length / subSwarmCount);
    
    for (let i = 0; i < subSwarmCount; i++) {
      const startIdx = i * agentsPerSwarm;
      const endIdx = i === subSwarmCount - 1 
        ? swarm.agents.length 
        : (i + 1) * agentsPerSwarm;
      
      const subAgents = swarm.agents.slice(startIdx, endIdx);
      
      const subSwarm = {
        id: uuidv4(),
        name: `${swarm.name}-sub${i}`,
        agents: subAgents,
        taskQueue: [],
        status: 'active',
        createdAt: Date.now()
      };

      this.swarms.set(subSwarm.id, subSwarm);
      subSwarmIds.push(subSwarm.id);
      this.metrics.totalSwarms++;
    }

    // Send DIVERGE command
    const divergeCommand = this.createCompressedCommand(
      LegionOpcode.DIVERGE,
      swarmId,
      { subSwarmCount, subSwarmIds }
    );

    console.log(`[DIVERGE] Split swarm into ${subSwarmCount} sub-swarms`);

    return subSwarmIds;
  }

  /**
   * Create compressed command with statistics
   */
  createCompressedCommand(opcode, swarmId, payload) {
    const jsonString = JSON.stringify(payload);
    const result = createLegionPacket(opcode, swarmId, payload);
    
    const stats = codec.getStats(jsonString, new TextDecoder().decode(result.packet.slice(40, 40 + result.encodedSize)));

    return {
      ...result,
      originalSize: stats.originalSize,
      encodedSize: stats.encodedSize,
      reductionPercent: stats.reductionPercent
    };
  }

  /**
   * Get swarm metrics
   */
  getMetrics() {
    const completedTasks = Array.from(this.swarms.values())
      .flatMap(s => s.taskQueue)
      .filter(t => t.status === 'completed').length;

    this.metrics.tasksCompleted = completedTasks;
    this.metrics.activeAgents = Array.from(this.agents.values())
      .filter(a => a.status !== 'offline').length;

    return { ...this.metrics };
  }

  /**
   * Get all swarms
   */
  getAllSwarms() {
    return Array.from(this.swarms.values());
  }

  /**
   * Get specific swarm
   */
  getSwarm(swarmId) {
    return this.swarms.get(swarmId);
  }

  /**
   * Terminate swarm
   */
  terminateSwarm(swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return false;

    // Send KILL command
    const killCommand = this.createCompressedCommand(
      LegionOpcode.KILL,
      swarmId,
      { timestamp: Date.now() }
    );

    // Mark agents as offline
    swarm.agents.forEach(agent => {
      agent.status = 'offline';
    });

    swarm.status = 'terminated';
    console.log(`[KILL] Terminated swarm ${swarm.name}`);

    return true;
  }

  /**
   * Sync swarm state
   */
  syncSwarm(swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return;

    // Send SYNC command
    const syncCommand = this.createCompressedCommand(
      LegionOpcode.SYNC,
      swarmId,
      { 
        agentCount: swarm.agents.length,
        taskCount: swarm.taskQueue.length,
        timestamp: Date.now()
      }
    );

    console.log(`[SYNC] Synced swarm ${swarm.name}`);
  }

  /**
   * Simulate task completion for demo
   */
  simulateTaskCompletion(swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return;

    const runningTasks = swarm.taskQueue.filter(t => t.status === 'running');
    runningTasks.forEach(task => {
      task.status = 'completed';
      task.result = { success: true, data: `Result from ${task.type}` };
      
      // Free the agent
      if (task.assignedAgent) {
        const agent = this.agents.get(task.assignedAgent);
        if (agent) agent.status = 'idle';
      }
    });
  }
}

// Singleton instance
export const swarmOrchestrator = new SwarmOrchestrator();

// Export for use in routes
export default swarmOrchestrator;
