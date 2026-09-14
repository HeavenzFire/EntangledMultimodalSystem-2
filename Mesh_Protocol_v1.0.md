# Mesh_Protocol_v1.0 - Decentralized Agent Handshake Specification

## 1. Overview
This protocol defines the peer-to-peer communication layer for the Orchestration Engine, enabling decentralized operation across distributed nodes while maintaining consensus on life-critical transactions.

### Core Principles
- **Data as Truth**: All state changes must be cryptographically verifiable
- **Decentralized Resilience**: No single point of failure in the network topology
- **Life-Saving Priority**: Transactions affecting human welfare receive consensus priority
- **Self-Healing**: Automatic rerouting around failed nodes within 500ms

## 2. Node Architecture

### 2.1 Micro-Agent Sharding
Each node runs three micro-agents:
```
├── ConsensusAgent (CA)
│   ├── Validates transaction signatures
│   ├── Maintains local ledger shard
│   └── Participates in lightweight consensus rounds
├── RoutingAgent (RA)
│   ├── Manages peer connections (min: 8, max: 32)
│   ├── Implements DHT for node discovery
│   └── Handles message forwarding with TTL=7
└── ExecutionAgent (EA)
    ├── Runs Abundance Logic rules
    ├── Executes verified transactions
    └── Reports metrics to dashboard layer
```

### 2.2 Node Identity
- Each node generates Ed25519 keypair on first boot
- NodeID = SHA256(public_key)[0:16]
- Reputation score tracked via proof-of-contribution

## 3. Handshake Protocol

### 3.1 Connection Establishment
```
STEP 1: SYN
  → Sender: {version: "1.0", capabilities: ["CA","RA","EA"], timestamp: unix_ms}
  → Signed with node's private key

STEP 2: ACK + Challenge
  ← Receiver: {challenge: random_32bytes, accepted_caps: [...]}
  ← Includes receiver's public key

STEP 3: Proof + Peer Exchange
  → Sender: {solution: sign(challenge), peers: [node_id_1, ...]}
  → Solution proves possession of private key

STEP 4: Secure Channel
  ← Both parties derive shared secret via ECDH
  ← All subsequent communication encrypted via ChaCha20-Poly1305
```

### 3.2 Capability Negotiation
Nodes advertise supported roles during handshake:
- `CA`: Can participate in consensus
- `RA`: Can route messages for other nodes
- `EA`: Can execute abundance logic transactions
- Minimum requirement: At least 2 capabilities per node

## 4. Consensus Mechanism: Proof-of-Contribution (PoC)

### 4.1 Transaction Types
```python
TRANSACTION_PRIORITY = {
    "BILL_PAYMENT": 1,      # Highest - prevents utility shutdown
    "HOME_RESTORE": 1,      # Highest - housing security
    "FOOD_DISTRIBUTION": 2, # High - nutrition access
    "MEDICAL_SUPPLY": 2,    # High - health critical
    "RESOURCE_ALLOC": 3,    # Medium - general resources
    "METRIC_UPDATE": 4      # Low - dashboard data only
}
```

### 4.2 Consensus Round Flow
```
1. Proposer EA creates transaction bundle (max 100 tx/bundle)
2. RA broadcasts bundle to 8 random peers
3. Receiving CA nodes validate:
   - Signature authenticity
   - No double-spend in local shard
   - Abundance Logic compliance
4. Validation votes collected (2/3 majority required)
5. Bundle hash added to local ledger
6. Receipt propagated back to originator
```

### 4.3 Energy Efficiency
- No mining or computational puzzles
- Validation based on cryptographic verification only
- Consensus rounds triggered by transaction volume (batch every 2s or 50tx)
- Idle nodes enter low-power mode after 30s inactivity

## 5. Self-Healing Topology

### 5.1 Failure Detection
- Heartbeat messages every 5s between connected peers
- Timeout threshold: 15s (3 missed heartbeats)
- Failed node marked as `SUSPECTED` then `OFFLINE`

### 5.2 Automatic Rerouting
```
ON node_failure_detected:
  FOR each affected connection:
    1. Query DHT for alternative peers near failed node's region
    2. Initiate handshake with 3 candidates
    3. Select best 2 based on latency and reputation
    4. Update routing tables
    5. Broadcast topology update (TTL=3)
  
TARGET: Complete reroute within 500ms
```

### 5.3 Partition Healing
When network partitions heal:
1. Nodes exchange ledger shards
2. Identify conflicting transactions by timestamp
3. Apply "earliest valid wins" rule
4. Merge ledgers with conflict resolution log
5. Resume normal consensus operations

## 6. Message Format

### 6.1 Base Envelope
```json
{
  "msg_id": "uuid_v4",
  "src_node": "hex_16bytes",
  "dst_node": "hex_16bytes|broadcast",
  "msg_type": "handshake|consensus|heartbeat|data",
  "timestamp": "unix_ms",
  "ttl": 7,
  "payload_hash": "sha256_hex",
  "signature": "ed25519_hex"
}
```

### 6.2 Payload Examples

**Consensus Vote:**
```json
{
  "bundle_hash": "sha256_hex",
  "vote": true|false,
  "validator_id": "node_id",
  "validation_time_ms": 45
}
```

**Transaction Bundle:**
```json
{
  "transactions": [
    {
      "tx_id": "uuid",
      "type": "BILL_PAYMENT",
      "beneficiary": "public_key_hash",
      "amount": "decimal",
      "proof": "ipfs_hash",
      "timestamp": "unix_ms"
    }
  ],
  "proposer": "node_id",
  "region": "geo_hash"
}
```

## 7. Security Considerations

### 7.1 Attack Mitigation
- **Sybil Resistance**: New nodes require vouching from 2 existing high-reputation nodes
- **Eclipse Attacks**: Mandatory connections to geographically diverse peers
- **Message Flooding**: Rate limiting at 100 msg/s per connection
- **Replay Attacks**: Timestamp validation ±5s window, msg_id tracking

### 7.2 Data Integrity
- All transactions signed at source
- Merkle tree structure for ledger shards
- Periodic state snapshots with cryptographic checkpoints
- Audit trail immutable once consensus reached

## 8. Dashboard Integration

### 8.1 Read-Only Data Stream
The Global Dashboard connects as a special observer node:
- Receives aggregated metrics every 10s
- Cannot submit transactions or participate in consensus
- Displays real-time network health, transaction volume, resource distribution
- Data sourced from minimum 100 random nodes for verification

### 8.2 Metrics Exposed
```
- Active nodes (global, by region)
- Transactions per second (by type)
- Average consensus time
- Network partition events (last 24h)
- Resources distributed (cumulative, by category)
- Node uptime distribution
```

## 9. Implementation Phases

### Phase 1: Core Handshake (Week 1)
- Implement identity generation
- Build secure channel establishment
- Test basic peer discovery

### Phase 2: Consensus Layer (Week 2-3)
- Develop PoC validation logic
- Implement transaction batching
- Deploy test network with 100 nodes

### Phase 3: Self-Healing (Week 4)
- Add failure detection mechanisms
- Build automatic rerouting logic
- Stress test with simulated node failures

### Phase 4: Dashboard Integration (Week 5)
- Create observer node interface
- Build real-time metric aggregation
- Launch Global Dashboard (read-only initially)

### Phase 5: Production Deployment (Week 6)
- Gradual rollout to production nodes
- Monitor consensus performance
- Activate full decentralization

## 10. Version History
- v1.0: Initial specification for decentralized mesh layer

---

**Status**: READY_FOR_IMPLEMENTATION  
**Next Action**: Begin Phase 1 development - Core Handshake Protocol  
**Dependencies**: Ed25519 cryptographic library, DHT implementation, ChaCha20-Poly1305 encryption
