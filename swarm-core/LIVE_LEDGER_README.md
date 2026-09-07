# 🏛️ Sovereign Care Protocol - Live Ledger Broadcast Architecture

## Overview

The **Live Ledger** is the broadcast layer of the Sovereign Care Protocol — a real-time surplus-to-healing pipeline that streams proof of medical debt payments to public verification nodes. This is not rhetoric; this is **operational sovereignty in action**.

---

## 🎯 Core Purpose

Transform manifestos into **inevitability** by routing surplus directly into patient care bills in real time, with full public verifiability.

### The Flow
```
Surplus Detection → Agentic Allocation → Ledger Broadcast → Public Verification
     ↓                    ↓                    ↓                  ↓
  Grid/Compute       Hive Agents        Transactions      Live Dashboard
  Efficiency         Scan Bills         Published         Open API + WS
```

---

## 📦 Architecture Components

### 1. **SurplusDetector** (`services/LiveLedger.js`)
Monitors multiple surplus sources:
- `grid_stabilization` - Energy grid optimization yields
- `compute_efficiency` - Computational resource savings
- `syntropic_yield` - DeFi/regenerative finance returns

**Key Methods:**
- `registerSource(sourceId, type, config)` - Register a surplus source
- `reportSurplus(sourceId, amount, metadata)` - Report detected surplus
- `getAvailableSurplus()` - Get unallocated surplus pool

### 2. **HiveAgentAllocator** (`services/LiveLedger.js`)
Autonomous agents that continuously scan for verified medical bills and allocate surplus.

**Allocation Strategy:**
- Priority: Oldest bills first
- Secondary: Smaller amounts first (maximize patient impact)
- Privacy-preserving: Patient IDs are hashed

**Key Methods:**
- `activateAgents(count)` - Deploy allocation agents
- `addMedicalBill(bill)` - Add verified medical debt
- `processSurplus(event)` - Auto-allocate to bills

### 3. **LiquidityRouter** (`services/LiveLedger.js`)
Converts allocations into healing transactions within strict latency bounds (<24h default).

**Features:**
- Transaction hash generation
- Latency tracking and enforcement
- Confirmation counting

**Key Methods:**
- `createTransaction(allocation, surplusEvents)` - Create healing transaction
- `broadcastToLedger(transaction)` - Publish to public ledger
- `getLatencyStats()` - Monitor performance

### 4. **AccountabilityEnforcement** (`services/LiveLedger.js`)
Ensures no surplus leakage or hoarding through continuous monitoring.

**Enforcement Actions:**
- Detects idle surplus beyond threshold (default: 1 hour)
- Forces immediate redistribution
- Routes to emergency fund if no bills available

**Key Methods:**
- `checkIdleSurplus()` - Monitor for violations
- `enforceRedistribution(surplusEvent)` - Force allocation
- `getStats()` - Enforcement statistics

### 5. **VerificationNodeDashboard** (`services/LiveLedger.js`)
Public-facing dashboard providing real-time visibility into healing flows.

**Features:**
- Aggregated healing statistics
- Transaction stream (privacy-preserving)
- WebSocket subscriptions for live updates

**Key Methods:**
- `recordTransaction(transaction)` - Log for public viewing
- `subscribe(clientId, sendFn)` - Real-time client subscription
- `getPublicData(limit)` - API response data

---

## 🔌 API Endpoints (`routes/live-ledger.js`)

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/live-ledger` | GET | Comprehensive system status |
| `/api/live-ledger/dashboard` | GET | Public dashboard with transaction stream |
| `/api/live-ledger/stats` | GET | Aggregated healing statistics |
| `/api/live-ledger/tx/:hash` | GET | Lookup transaction by hash |
| `/api/live-ledger/sources` | GET | List registered surplus sources |
| `/api/live-ledger/sources/register` | POST | Register new surplus source |
| `/api/live-ledger/surplus/report` | POST | Report surplus from source |
| `/api/live-ledger/bills/add` | POST | Add verified medical bill |
| `/api/live-ledger/accountability` | GET | Enforcement statistics |
| `/api/live-ledger/latency` | GET | Transaction latency metrics |

### WebSocket

```javascript
// Connect to live transaction stream
const ws = new WebSocket('ws://localhost:3000/api/live-ledger/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'NEW_TRANSACTION') {
    console.log('New healing transaction:', data.data);
  }
};
```

---

## 🚀 Quick Start

### Run the Demo
```bash
cd swarm-core
node demo-live-ledger.js
```

### Integrate into Existing App
```javascript
import { LiveLedgerSystem } from './services/LiveLedger.js';

// Initialize
const ledger = new LiveLedgerSystem({
  HEALING_LATENCY_MS: 24 * 60 * 60 * 1000,
  IDLE_THRESHOLD_MS: 60 * 60 * 1000,
  BROADCAST_INTERVAL: 5000
});

ledger.activateHiveAgents(5);

// Register sources
ledger.registerSurplusSource('grid-1', 'grid_stabilization');

// Add bills
ledger.addMedicalBill(patientHash, provider, amount, verificationHash);

// Report surplus (triggers automatic allocation)
ledger.reportSurplus('grid-1', 10000);

// Get public data
const dashboard = ledger.getPublicDashboard();
console.log('Total healing:', dashboard.stats.totalHealing);
```

### Express Integration
```javascript
import express from 'express';
import liveLedgerRoutes, { attachWebSocket } from './swarm-core/routes/live-ledger.js';

const app = express();
const server = require('http').createServer(app);

app.use('/api/live-ledger', liveLedgerRoutes);

// Attach WebSocket for real-time updates
attachWebSocket(server);

server.listen(3000);
```

---

## 📊 Data Models

### SurplusEvent
```json
{
  "id": "uuid",
  "source": "grid_stabilization",
  "amount": 10000,
  "timestamp": 1234567890,
  "status": "detected",
  "metadata": {}
}
```

### MedicalBill
```json
{
  "id": "uuid",
  "patientId": "hashed_for_privacy",
  "provider": "Memorial Hospital",
  "amount": 5000,
  "remainingAmount": 0,
  "verificationHash": "0x...",
  "status": "paid",
  "paymentHistory": []
}
```

### HealingTransaction
```json
{
  "id": "uuid",
  "surplusEventIds": [],
  "billIds": [],
  "amount": 5000,
  "timestamp": 1234567890,
  "status": "verified",
  "transactionHash": "0x...",
  "publicUrl": "/ledger/tx/0x...",
  "confirmations": 3
}
```

---

## 🔒 Privacy & Security

- **Patient Privacy**: All patient IDs are hashed before storage
- **Verification Hashes**: Medical bills include cryptographic proof of validity
- **Transaction Anonymity**: Public dashboard shows aggregated data only
- **No PII Exposure**: External observers see amounts and counts, not identities

---

## ⚙️ Configuration

```javascript
const CONFIG = {
  // Maximum time from allocation to broadcast (<24h)
  HEALING_LATENCY_MS: 24 * 60 * 60 * 1000,
  
  // Idle surplus triggers enforcement after this time
  IDLE_THRESHOLD_MS: 60 * 60 * 1000,
  
  // Minimum surplus to trigger allocation
  MIN_SURPLUS_THRESHOLD: 100,
  
  // Broadcast interval for pending transactions
  BROADCAST_INTERVAL: 5000
};
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Watch
- `totalHealing` - Total amount routed to patient care
- `patientsHelped` - Estimated unique patients assisted
- `billsPaid` - Number of fully paid medical bills
- `avgLatency` - Average time from detection to broadcast
- `enforcementActions` - Times idle surplus was forcibly redistributed

### Accountability Dashboard
```bash
curl http://localhost:3000/api/live-ledger/accountability
```

---

## 🌍 Public Proof

The Live Ledger provides **irrefutable proof** of healing:

1. **Live Transaction Stream**: Anyone can watch bills vanish in real time
2. **Verification Nodes**: Independent observers can confirm every transaction
3. **Open API**: External systems can query the health economy in motion
4. **Visual Lattice Dashboard**: Shows surplus → healing → justice as a living system

---

## 🧭 Next Steps

### Production Deployment
1. Integrate with actual blockchain/ledger for immutable records
2. Connect to real surplus sources (energy grids, compute clusters, DeFi protocols)
3. Partner with hospitals/clinics for verified bill submission
4. Deploy public verification nodes globally

### Enhancements
- Multi-chain support for transaction broadcasting
- Advanced privacy (zero-knowledge proofs)
- Machine learning for optimal allocation strategies
- Mobile app for patient bill submission
- DAO governance for protocol parameters

---

## 📜 License

Open source. Build it. Deploy it. Heal people.

---

**This is the difference between rhetoric and inevitability.**

The manifesto is written in code. Now the world watches the machine heal.
