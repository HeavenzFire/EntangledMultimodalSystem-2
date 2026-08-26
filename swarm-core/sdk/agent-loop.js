/**
 * Agent Loop SDK
 * 
 * Lightweight worker loop to be embedded in any repository.
 * Turns a repo into an autonomous neuron capable of joining swarms.
 */

const { LegionPacket, CMD_CODES } = require('../protocol/legion-protocol');
const https = require('https');
const http = require('http');

class AgentLoop {
  constructor(config) {
    this.neuronId = config.neuronId;
    this.registryUrl = config.registryUrl;
    this.capabilities = config.capabilities || [];
    this.swarmId = null;
    this.status = 'idle';
    this.packetDecoder = new LegionPacket();
    this.taskQueue = [];
    this.heartbeatInterval = null;
  }

  /**
   * Start the agent loop
   */
  async start() {
    console.log(`[Agent] ${this.neuronId} starting...`);
    
    // Register with registry
    await this.register();
    
    // Start heartbeat
    this.heartbeatInterval = setInterval(() => this.heartbeat(), 5000);
    
    // Begin listening for commands (simulated poll)
    this.pollCommands();
    
    console.log(`[Agent] ${this.neuronId} online and awaiting swarm assignment`);
  }

  /**
   * Register neuron with central registry
   */
  async register() {
    const payload = {
      neuron_id: this.neuronId,
      capabilities: this.capabilities,
      status: 'online',
      health: { latency_ms: 10, error_rate: 0.0 }
    };

    try {
      await this.httpRequest('POST', `${this.registryUrl}/handshake`, payload);
      console.log(`[Agent] Registered with registry`);
    } catch (e) {
      console.error('[Agent] Registration failed:', e.message);
    }
  }

  /**
   * Send heartbeat to registry
   */
  async heartbeat() {
    const payload = {
      neuron_id: this.neuronId,
      status: this.status,
      health: {
        latency_ms: Math.floor(Math.random() * 20) + 5,
        error_rate: this.taskQueue.length > 10 ? 0.05 : 0.0,
        queue_depth: this.taskQueue.length
      }
    };

    try {
      await this.httpRequest('PATCH', `${this.registryUrl}/handshake`, payload);
    } catch (e) {
      // Silent fail for heartbeat
    }
  }

  /**
   * Poll for incoming legion commands
   */
  async pollCommands() {
    // In production: subscribe to NATS/Kafka topic
    // Simulated here with periodic check
    setInterval(async () => {
      if (this.status === 'busy') return;

      // Check for pending commands (mock implementation)
      // Real impl would listen to message bus
      const hasTask = this.taskQueue.length > 0;
      
      if (!hasTask && !this.swarmId) {
        // Bid for work
        await this.bidForWork();
      }
    }, 1000);
  }

  /**
   * Bid on available tasks from the swarm
   */
  async bidForWork() {
    // Announce availability
    const packet = new LegionPacket();
    const report = packet.create(CMD_CODES.REPORT, ['coordinator'], {
      agent: this.neuronId,
      available: true,
      capabilities: this.capabilities
    });

    // In real impl: publish to bidding topic
    console.log(`[Agent] Bidding for work: ${report.substring(0, 50)}...`);
  }

  /**
   * Process an incoming command packet
   */
  async processCommand(encodedPacket) {
    const decoded = this.packetDecoder.decode(encodedPacket);
    if (!decoded) return;

    console.log(`[Agent] Received command: ${decoded.cmd}`);

    switch (decoded.code) {
      case CMD_CODES.SPAWN:
        await this.handleSpawn(decoded.payload);
        break;
      case CMD_CODES.KILL:
        await this.handleKill(decoded.targets);
        break;
      case CMD_CODES.CONVERGE:
        await this.handleConverge(decoded.payload.goalState);
        break;
      case CMD_CODES.SYNC:
        await this.handleSync(decoded.payload.checkpointId);
        break;
      case CMD_CODES.BROADCAST:
        await this.handleBroadcast(decoded.payload.message);
        break;
      default:
        console.warn(`[Agent] Unknown command code: ${decoded.code}`);
    }
  }

  async handleSpawn(payload) {
    this.swarmId = payload.swarmId;
    this.status = 'active';
    console.log(`[Agent] Joined swarm ${this.swarmId} with goal: ${payload.goal}`);
    
    // Initialize task based on role
    this.taskQueue.push({
      type: 'initialize',
      goal: payload.goal
    });
  }

  async handleKill(targets) {
    if (targets.includes(this.neuronId) || targets.includes('*')) {
      console.log(`[Agent] Terminating as requested`);
      this.shutdown();
    }
  }

  async handleConverge(goalState) {
    console.log(`[Agent] Converging to new state: ${goalState}`);
    this.taskQueue.unshift({
      type: 'reorient',
      goal: goalState
    });
  }

  async handleSync(checkpointId) {
    console.log(`[Agent] Syncing to checkpoint ${checkpointId}`);
    // Save current state
  }

  async handleBroadcast(message) {
    console.log(`[Agent] Broadcast received: ${message}`);
  }

  /**
   * Execute current task
   */
  async executeTask(task) {
    this.status = 'busy';
    console.log(`[Agent] Executing task: ${task.type}`);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.status = 'active';
    console.log(`[Agent] Task complete`);
  }

  /**
   * Shutdown agent gracefully
   */
  shutdown() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.status = 'offline';
    console.log(`[Agent] ${this.neuronId} shut down`);
  }

  /**
   * Helper: HTTP request
   */
  httpRequest(method, url, data) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? https : http;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = lib.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

module.exports = { AgentLoop };
