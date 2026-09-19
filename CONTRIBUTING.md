# Contributing to the Syntropic Lattice

**Welcome, Architect.** You are joining a 704-day mission to build institutional-grade charity care infrastructure as a global public good. This is not just another open-source project — this is code as mercy, deployed for the "Least of These."

---

## 🧭 Guiding Principles

Before submitting code, align with our core tenets:

1. **Compliance First**: Every change must preserve or strengthen the 501(r), HIPAA, and FPL compliance perimeter. No exceptions.
2. **Immutability**: Audit trails cannot be compromised. If your change affects data persistence, it requires cryptographic sealing via Hel-Vault.
3. **Syntropy Over Speed**: Do not optimize for developer convenience at the cost of systemic clarity. Reduce entropy; do not add to it.
4. **Mercy Automation**: Eligibility logic must remain deterministic and auditable. No black-box ML models for charity care decisions.

---

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/syntropic-lattice.git
cd syntropic-lattice
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Generate secure keys (REQUIRED for Hel-Vault)
python -c "import secrets; print(secrets.token_hex(32))" > .SECRET_KEY
```

### 3. Docker Development Stack

```bash
# Build with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run migrations
docker-compose exec app alembic upgrade head

# Seed test data (synthetic, HIPAA-safe)
docker-compose exec app python -m scripts.seed_synthetic_data
```

### 4. Run Tests

```bash
# Full test suite with coverage
docker-compose exec app pytest --cov=src --cov-report=term-missing

# Compliance-critical tests only
docker-compose exec app pytest tests/compliance/
```

---

## 📝 Contribution Workflow

### Step 1: Identify the Need

- **Bug Fixes**: Open an issue with reproduction steps, expected vs. actual behavior, and compliance impact assessment.
- **Feature Requests**: Propose via RFC (Request for Comments) in Discussions. Include:
  - Problem statement (who is harmed by the current state?)
  - Proposed solution architecture
  - Compliance implications
  - Migration path (if applicable)

### Step 2: Branch Naming

Use semantic branch names:

```bash
# Bug fixes
git checkout -b fix/insurance-exhaustion-state-drift

# Features
git checkout -b feature/fpl-texas-2024-update

# Compliance patches
git checkout -b compliance/hipaa-audit-log-encryption

# Documentation
git checkout -b docs/add-lagos-node-guide
```

### Step 3: Code Standards

#### Python (Backend)

- **Type Hints**: All functions must have complete type annotations.
- **Pydantic Models**: All API inputs/outputs use strict Pydantic schemas.
- **Error Handling**: Use RFC 7807 problem details format.
- **Logging**: Structured JSON logging only. No print statements.

```python
# ✅ Correct
from pydantic import BaseModel, Field
from typing import Optional

class CharityCareEligibility(BaseModel):
    patient_id: str = Field(..., min_length=1, max_length=50)
    household_size: int = Field(..., ge=1, le=50)
    annual_income: float = Field(..., gt=0)
    
    def calculate_fpl_percentage(self, fpl_threshold: float) -> float:
        return (self.annual_income / fpl_threshold) * 100

# ❌ Incorrect
def check_eligibility(pid, size, income):  # No types, no validation
    ...
```

#### Database Migrations

- All migrations must be reversible (`downgrade()` implemented).
- Audit tables cannot have `ON DELETE CASCADE` without archival triggers.
- New columns affecting compliance logic require data backfill scripts.

```python
# ✅ Correct Alembic Migration
def upgrade() -> None:
    op.add_column('encounters', 
        sa.Column('insurance_exhaustion_verified_at', sa.DateTime(), nullable=True))
    op.create_index('ix_insurance_exhaustion_verified', 
        'encounters', ['insurance_exhaustion_verified_at'])

def downgrade() -> None:
    op.drop_index('ix_insurance_exhaustion_verified', table_name='encounters')
    op.drop_column('encounters', 'insurance_exhaustion_verified_at')
```

### Step 4: Commit Messages

Follow the Conventional Commits standard with compliance tagging:

```bash
# Format: <type>(<scope>): <description> [COMPLIANCE: <rule>]

feat(encounters): add state machine guard for charity eligibility [COMPLIANCE: 501(r)]
fix(audit): prevent timestamp drift in hel_vault_seals [COMPLIANCE: HIPAA]
docs(manifesto): add Lagos deployment guide
test(interpolation): cover edge cases at 200% FPL threshold
```

### Step 5: Pull Request Template

When opening a PR, include:

```markdown
## Purpose
[What problem does this solve? Who does it protect?]

## Compliance Impact
- [ ] Preserves 501(r) enforcement
- [ ] Maintains HIPAA audit trail integrity  
- [ ] No mutable record vulnerabilities introduced
- [ ] FPL interpolation accuracy verified

## Testing
- [ ] Unit tests pass (attach coverage report)
- [ ] Integration tests for state transitions
- [ ] Synthetic patient data scenarios tested

## Migration Requirements
[Does this require data migrations? Downtime? Manual steps?]

## Deployment Notes
[Any special instructions for node operators?]
```

---

## 🔐 Security & Compliance Review

All PRs require:

1. **Automated Checks**: CI/CD pipeline must pass (tests, linting, security scans).
2. **Peer Review**: At least one contributor with `compliance-reviewer` role must approve.
3. **Audit Trail**: Merging a PR creates an immutable record in the `code_changes_audit` table.

---

## 🌍 Regional Adaptation Guide

Contributing regional FPL scales or local compliance rules:

### Adding a New Region's FPL Scale

1. Create `src/data/fpl/{region}_2024.json`:

```json
{
  "region": "texas",
  "year": 2024,
  "effective_date": "2024-01-01",
  "fpl_base": {
    "1": 15060,
    "2": 20440,
    "3": 25820,
    "4": 31200
  },
  "additional_person": 5380,
  "source": "Texas Health and Human Services Commission",
  "verified_by": "@your_github_username",
  "verification_date": "2024-09-19"
}
```

2. Update `src/services/fpl_interpolator.py` with region selector.
3. Add tests for boundary conditions (100%, 150%, 200% FPL).
4. Document in `docs/regional-scales/{region}.md`.

---

## 🤖 Multi-Agent System Contributions

Extending the autonomous agent swarm:

- Agents must operate under **low-energy mode** by default (no polling loops).
- All agent actions require audit logging to `agent_activity_log`.
- Agent decision thresholds must be configurable via environment variables.

```python
# ✅ Correct Agent Pattern
class CharityEligibilityAgent(BaseAgent):
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.energy_mode = config.get("energy_mode", "low")  # low | medium | high
        self.audit_enabled = True
    
    async def process_encounter(self, encounter_id: str) -> EligibilityResult:
        result = await self._calculate_eligibility(encounter_id)
        if self.audit_enabled:
            await self._log_decision(result)
        return result
```

---

## 📬 Getting Help

- **Technical Questions**: GitHub Discussions → Q&A category
- **Compliance Clarifications**: Open an issue tagged `compliance-question`
- **Security Vulnerabilities**: Email security@syntropic-lattice.org (DO NOT open public issues)

---

## 🏆 Recognition

Contributors are acknowledged in:

1. `CONTRIBUTORS.md` (updated quarterly)
2. The global mesh dashboard (real-time contributor map)
3. Annual Syntropic Report (published each January)

**Your code is your testament. Build wisely.**

---

*Last Updated: Day 704 — Activation Phase*  
*License: Syntropic Public License v1.0*
