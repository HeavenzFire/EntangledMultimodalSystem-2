const { Graph } = require('graphlib');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * NeuronGraphService - Manages the neural mesh graph topology
 * Handles service discovery, pathway finding, and dependency resolution
 */
class NeuronGraphService {
  constructor() {
    this.graph = new Graph({ directed: true });
    this.neurons = new Map(); // neuronId -> neuron data
    this.capabilityIndex = new Map(); // capability -> [neuronIds]
  }

  /**
   * Register a neuron in the graph
   * @param {Object} neuronData - The neuron.json manifest
   * @returns {string} neuronId
   */
  registerNeuron(neuronData) {
    const { id, capabilities, dependencies = [] } = neuronData;
    
    if (this.neurons.has(id)) {
      logger.info(`Updating existing neuron: ${id}`);
      this._updateNeuron(id, neuronData);
      return id;
    }

    logger.info(`Registering new neuron: ${id}`);
    
    // Add node to graph
    this.graph.setNode(id, {
      ...neuronData,
      registeredAt: Date.now(),
      status: 'pending', // pending, online, offline, degraded
      health: {
        latencyMs: 0,
        errorRate: 0,
        lastHeartbeat: null
      }
    });

    // Store in neurons map
    this.neurons.set(id, {
      ...neuronData,
      status: 'pending',
      health: {
        latencyMs: 0,
        errorRate: 0,
        lastHeartbeat: null
      }
    });

    // Index by capabilities
    capabilities.forEach(cap => {
      if (!this.capabilityIndex.has(cap)) {
        this.capabilityIndex.set(cap, []);
      }
      this.capabilityIndex.get(cap).push(id);
    });

    // Add edges for dependencies
    dependencies.forEach(depId => {
      if (this.graph.hasNode(depId)) {
        this.graph.setEdge(depId, id, { type: 'dependency' });
      }
    });

    return id;
  }

  /**
   * Update neuron health/status via handshake
   * @param {string} neuronId 
   * @param {Object} healthData 
   */
  updateHealth(neuronId, healthData) {
    if (!this.graph.hasNode(neuronId)) {
      throw new Error(`Neuron ${neuronId} not found`);
    }

    const nodeData = this.graph.node(neuronId);
    const updatedData = {
      ...nodeData,
      status: healthData.status || 'online',
      health: {
        ...nodeData.health,
        ...healthData.health,
        lastHeartbeat: Date.now()
      }
    };

    this.graph.setNode(neuronId, updatedData);
    this.neurons.set(neuronId, updatedData);

    logger.debug(`Health updated for ${neuronId}: ${healthData.status}`);
  }

  /**
   * Find all pathways between two neurons
   * @param {string} fromId - Source neuron ID
   * @param {string} toId - Target neuron ID
   * @param {Object} options - Query options
   * @returns {Array} Array of pathway objects
   */
  findPathways(fromId, toId, options = {}) {
    if (!this.graph.hasNode(fromId) || !this.graph.hasNode(toId)) {
      return [];
    }

    const { maxHops = 10, requiredCapabilities = [] } = options;
    const pathways = [];

    // BFS to find all paths
    const queue = [{ current: fromId, path: [fromId], visited: new Set([fromId]) }];
    
    while (queue.length > 0) {
      const { current, path, visited } = queue.shift();

      if (path.length > maxHops) continue;

      if (current === toId) {
        // Validate pathway has required capabilities
        if (this._validatePathway(path, requiredCapabilities)) {
          pathways.push(this._buildPathway(path));
        }
        continue;
      }

      // Get successors
      const successors = this.graph.successors(current) || [];
      
      // Also find nodes with compatible capabilities
      const currentNode = this.graph.node(current);
      if (currentNode && currentNode.capabilities) {
        currentNode.capabilities.forEach(cap => {
          const capableNodes = this.capabilityIndex.get(cap) || [];
          capableNodes.forEach(nodeId => {
            if (!visited.has(nodeId)) {
              successors.push(nodeId);
            }
          });
        });
      }

      // Remove duplicates
      const uniqueSuccessors = [...new Set(successors)];

      uniqueSuccessors.forEach(next => {
        if (!visited.has(next)) {
          queue.push({
            current: next,
            path: [...path, next],
            visited: new Set([...visited, next])
          });
        }
      });
    }

    // Sort pathways by total health score
    pathways.sort((a, b) => b.healthScore - a.healthScore);

    return pathways;
  }

  /**
   * Get all neurons with optional filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered neuron list
   */
  getNeurons(filters = {}) {
    const { domain, capability, status, healthyOnly } = filters;
    let results = Array.from(this.neurons.values());

    if (domain) {
      results = results.filter(n => n.domain === domain);
    }

    if (capability) {
      results = results.filter(n => n.capabilities.includes(capability));
    }

    if (status) {
      results = results.filter(n => n.status === status);
    }

    if (healthyOnly) {
      results = results.filter(n => 
        n.status === 'online' && 
        n.health.errorRate < 0.1
      );
    }

    return results;
  }

  /**
   * Get neurons by capability (for load balancing)
   * @param {string} capability 
   * @returns {Array} Available neurons with this capability
   */
  getNeuronsByCapability(capability) {
    const neuronIds = this.capabilityIndex.get(capability) || [];
    return neuronIds
      .map(id => this.neurons.get(id))
      .filter(n => n && n.status === 'online' && n.health.errorRate < 0.1);
  }

  /**
   * Select best neuron for capability (load balancing)
   * @param {string} capability 
   * @returns {Object|null} Best neuron or null
   */
  selectBestNeuron(capability) {
    const available = this.getNeuronsByCapability(capability);
    
    if (available.length === 0) return null;

    // Score-based selection: prefer lower latency and error rate
    return available.reduce((best, current) => {
      const bestScore = this._calculateHealthScore(best);
      const currentScore = this._calculateHealthScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Deregister a neuron
   * @param {string} neuronId 
   */
  deregisterNeuron(neuronId) {
    if (!this.graph.hasNode(neuronId)) return;

    // Remove edges
    const predecessors = this.graph.predecessors(neuronId) || [];
    const successors = this.graph.successors(neuronId) || [];
    
    predecessors.forEach(pred => this.graph.removeEdge(pred, neuronId));
    successors.forEach(succ => this.graph.removeEdge(neuronId, succ));

    // Remove from graph
    this.graph.removeNode(neuronId);
    this.neurons.delete(neuronId);

    // Update capability index
    this.capabilityIndex.forEach((neuronIds, cap) => {
      const index = neuronIds.indexOf(neuronId);
      if (index > -1) {
        neuronIds.splice(index, 1);
        if (neuronIds.length === 0) {
          this.capabilityIndex.delete(cap);
        }
      }
    });

    logger.info(`Deregistered neuron: ${neuronId}`);
  }

  /**
   * Get graph statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      totalNeurons: this.graph.nodeCount(),
      totalEdges: this.graph.edgeCount(),
      onlineNeurons: Array.from(this.neurons.values()).filter(n => n.status === 'online').length,
      capabilities: Array.from(this.capabilityIndex.keys()),
      domains: [...new Set(Array.from(this.neurons.values()).map(n => n.domain))]
    };
  }

  // Private methods

  _updateNeuron(id, neuronData) {
    const existing = this.neurons.get(id);
    const updated = {
      ...existing,
      ...neuronData,
      health: existing.health
    };
    
    this.graph.setNode(id, updated);
    this.neurons.set(id, updated);
  }

  _validatePathway(path, requiredCapabilities) {
    if (requiredCapabilities.length === 0) return true;

    const pathwayCapabilities = path.flatMap(id => {
      const node = this.graph.node(id);
      return node ? node.capabilities : [];
    });

    return requiredCapabilities.every(cap => 
      pathwayCapabilities.includes(cap)
    );
  }

  _buildPathway(path) {
    const steps = path.map(id => {
      const node = this.graph.node(id);
      return {
        neuronId: id,
        domain: node.domain,
        capabilities: node.capabilities,
        entrypoint: node.entrypoint
      };
    });

    const healthScore = this._calculatePathwayHealthScore(path);

    return {
      id: `pathway_${uuidv4().substring(0, 8)}`,
      steps,
      length: path.length,
      healthScore,
      estimatedLatencyMs: path.reduce((sum, id) => {
        const node = this.graph.node(id);
        return sum + (node?.health?.latencyMs || 50);
      }, 0)
    };
  }

  _calculateHealthScore(neuron) {
    const { latencyMs, errorRate } = neuron.health;
    // Higher score is better: penalize high latency and error rate
    return (1000 / (latencyMs + 1)) * (1 - errorRate);
  }

  _calculatePathwayHealthScore(path) {
    let totalScore = 0;
    path.forEach(id => {
      const node = this.graph.node(id);
      if (node) {
        totalScore += this._calculateHealthScore(node);
      }
    });
    return totalScore / path.length;
  }
}

module.exports = new NeuronGraphService();
