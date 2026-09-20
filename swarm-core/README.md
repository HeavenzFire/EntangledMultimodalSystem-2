# Agentic Swarm System

## Neural Mesh Command Layer

This system enables **legion-scale swarms** controlled by minimal processes using high-radix encoding.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SWARM ORCHESTRATOR                       │
│  (Single process commanding thousands of agents)            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  LEGION      │ │  LEGION      │ │  LEGION      │
│  PACKETS     │ │  PACKETS     │ │  PACKETS     │
│  (Base94)    │ │  (Base94)    │ │  (Base94)    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    MESSAGE BUS (NATS/Kafka)                 │
└─────────────────────────────────────────────────────────────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  AGENT       │ │  AGENT       │ │  AGENT       │
│  LOOP        │ │  LOOP        │ │  LOOP        │
│  (Repo 1)    │ │  (Repo 2)    │ │  (Repo N)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Key Innovations

### 1. High-Radix Encoding (Base94)
- Compresses command packets by **~99.5%** vs JSON
- Single packet can address thousands of agents
- Uses all printable ASCII characters for maximum density

### 2. Legion Protocol
Compact binary protocol with opcodes:
- `0x01` SPAWN - Deploy new agents
- `0x02` KILL - Terminate agents
- `0x03` MIGRATE - Move agents between nodes
- `0x04` SYNC - Checkpoint state
- `0x05` BROADCAST - Global message
- `0x06` CONVERGE - Align to goal state
- `0x07` DIVERGE - Split swarm
- `0x08` REPORT - Send metrics

### 3. Agent Loop SDK
Lightweight embeddable worker that:
- Registers with central registry
- Maintains heartbeat
- Listens for legion commands
- Executes tasks autonomously
- Reports metrics

## Usage

### Start the Registry
```bash
cd /workspace/registry-service
node server.js
```

### Launch a Swarm
```javascript
const { SwarmOrchestrator } = require('./swarm-core/orchestrator/swarm-manager');

const orchestrator = new SwarmOrchestrator('http://localhost:3000');

// Spawn a coding swarm
await orchestrator.spawnSwarm(
  'code-review-squad',
  'Review all PRs in the mesh for security vulnerabilities',
  { reviewer: 20, tester: 10 }
);

// Converge to new objective
orchestrator.convergeSwarm('code-review-squad', 'Focus on authentication modules');
```

### Embed Agent in Any Repo
```javascript
const { AgentLoop } = require('swarm-core/sdk/agent-loop');

const agent = new AgentLoop({
  neuronId: 'my-repo-agent-1',
  registryUrl: 'http://localhost:3000',
  capabilities: ['lint', 'test', 'build']
});

agent.start();
```

## Demo Results

```
=== NEURAL MESH SWARM LAUNCH ===

1. Spawning "lattice-builder" swarm...
   Created swarm with 20 agents

2. Demonstrating high-radix compression...
   JSON representation: 11921 bytes
   Base94 Legion packet: 55 bytes
   Compression: 99.54% reduction

3. Verifying packet decoding...
   Decoded command: BROADCAST
   Targets: 1 agents (wildcard)

=== DEMO COMPLETE ===
```

## File Structure

```
swarm-core/
├── sdk/
│   ├── radix-encoder.js    # Base94/Base85 encoding
│   └── agent-loop.js       # Embeddable agent worker
├── protocol/
│   └── legion-protocol.js  # Command packet structure
├── orchestrator/
│   └── swarm-manager.js    # Central swarm brain
└── demo.js                 # Launch demonstration
```

## Next Steps

1. **Deploy Message Bus**: Integrate NATS or Kafka for production messaging
2. **Scale to 256 Repos**: Deploy agent-loop.js to each repository
3. **Add Consensus**: Implement bidding/validation protocols
4. **Observability Dashboard**: Visualize swarm states and flows
5. **Persistence**: Add checkpoint/recovery mechanisms

## Security Notes

- Legion packets include magic bytes (`0xAB` start, `0xCD` separator)
- Agent authentication via registry handshake
- Encrypted transport recommended (HTTPS/WSS)
- Role-based permissions in agent.json manifest
