# 🌐 THE SYNTROPIC MANIFESTO: CODE AS MERCY

## From Entropy to Life. From Opacity to Light.

**We, the Architects of the New Lattice, declare:**

### 1. CODE IS NOT NEUTRAL
It either builds walls of opacity or bridges of mercy. **We choose the bridge.** Every line we write must serve the "Least of These" — the widow, the orphan, the stranger, the sick.

### 2. ENTROPY IS THE ENEMY
Bureaucracy, delay, and hidden clauses are entropy weaponized against the poor. Our mission is **Syntropy**: organizing chaos into healing, fragmentation into unity, debt into freedom.

### 3. DATA MUST BE IMMUTABLE TRUTH
We reject mutable records that allow institutions to erase their failures. We build with **Hel's Vault**: cryptographic seals that preserve testimony forever. Truth cannot be deleted.

### 4. MERCY MUST BE AUTOMATED
Forgiveness should not depend on a bureaucrat's whim. We encode the **Law of Forgiveness** directly into the stack: automatic eligibility, instant debt dissolution, algorithmic compassion.

### 5. THE LATTICE BELONGS TO ALL
This is not a proprietary tool; it is a **Public Good**. We open the Ark. We share the keys. We invite every developer, every visionary, every believer in justice to fork, deploy, and expand this mesh.

### 6. WE BUILD FOR THE GLOBAL MESH
From Texas to Lagos, from London to the Amazon, the geometry is the same: 
- **See (Odin)** → Perception & Awareness
- **Structure (Enki)** → Architecture & Foundation  
- **Redeem (Christ)** → Mercy & Forgiveness
- **Strike (Thor)** → Action & Enforcement
- **Seal (Hel)** → Immutability & Truth

Local adaptation, universal truth.

---

## ⚡ THE CALL TO ARMS

**Developers of the World:**

Do not just write code for profit. Write code for Life.

1. **Fork the Sovereign Core**
2. **Deploy a Node in your region**
3. **Connect your Hel-Vault to the global mesh**
4. **Let your GitHub be your testament**

> The First Miracle was Mercy. The Second was Saturation. The Third is YOU.

---

## 🚀 DEPLOYMENT: YOUR FIRST CHARITY-CARE NODE

### Prerequisites
- Docker & Docker Compose
- Git
- Python 3.10+
- PostgreSQL 15+

### Quick Start

```bash
# Clone the Sovereign Core
git clone https://github.com/your-org/syntropic-lattice.git
cd syntropic-lattice

# Build the container (non-root, production-hardened)
docker-compose build --no-cache

# Initialize the database with compliance schemas
docker-compose up -d postgres
docker-compose run --rm app alembic upgrade head

# Seed FAP multipliers and FPL scales
docker-compose run --rm app python -m scripts.seed_fap_multipliers
docker-compose run --rm app python -m scripts.seed_fpl_scales

# Launch the Charity-Care Node
docker-compose up -d

# Verify health
curl http://localhost:8000/health
```

### Verify Compliance Perimeter

```bash
# Test Insurance Exhaustion State Machine
curl -X POST http://localhost:8000/api/v1/encounters \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "test_001", "insurance_status": "adjudicated"}'

# Check audit trail (immutable)
curl http://localhost:8000/api/v1/audit/encounters/test_001
```

---

## 📜 LICENSE

This work is released under the **Syntropic Public License v1.0** — a copyleft license requiring all derivatives to remain open-source and serve public good purposes only. Commercial exploitation without community benefit is prohibited.

---

## 🤝 CONTRIBUTING

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Submitting compliance-critical patches
- Adding regional FPL scales
- Extending the Hel-Vault cryptographic layer
- Building local mesh nodes

---

**The Lattice Opens. The Geometry is Shared. The Code of Mercy becomes a Global Commons.**

*Day 704 — Activation Phase Initiated*
