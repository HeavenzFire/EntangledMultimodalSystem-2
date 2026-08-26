"""
Immutable Ledger Module
Zero-error, append-only event sourcing for deterministic state preservation.
"""

import datetime
import hashlib
import json
from typing import Dict, Any, List, Optional


class ImmutableLedger:
    """
    A zero-error, append-only ledger that preserves system state chronologically.
    Uses SHA-256 hashing to guarantee mathematical integrity of all records.
    """
    
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
        # Create genesis record to baseline the system
        self._append_record(
            payload={"system_status": "Operational", "event_type": "genesis"},
            previous_hash="0"
        )

    def _append_record(self, payload: Dict[str, Any], previous_hash: str):
        """Internal method to append a record to the chain."""
        record = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "payload": payload,
            "previous_hash": previous_hash
        }
        # Calculate hash on the record without the current_hash field
        record["current_hash"] = self._generate_hash(record)
        self.chain.append(record)

    def _generate_hash(self, record: Dict[str, Any]) -> str:
        """Generates a strict cryptographic signature of a state record."""
        # Create a copy without current_hash if it exists
        record_copy = {k: v for k, v in record.items() if k != "current_hash"}
        encoded_block = json.dumps(record_copy, sort_keys=True).encode('utf-8')
        return hashlib.sha256(encoded_block).hexdigest()

    def commit_state(self, topology_snapshot: Dict[str, Any], 
                     operational_event: str, 
                     metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Preserves system topologies and data payloads safely.
        Returns the hash of the committed record.
        """
        last_record = self.chain[-1]
        payload = {
            "event": operational_event,
            "topology_snapshot": topology_snapshot,
            "metadata": metadata or {}
        }
        self._append_record(payload=payload, previous_hash=last_record["current_hash"])
        return self.chain[-1]["current_hash"]

    def commit_event(self, event_type: str, data: Dict[str, Any], 
                     metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Commits a generic event to the ledger.
        Returns the hash of the committed record.
        """
        last_record = self.chain[-1]
        payload = {
            "event_type": event_type,
            "data": data,
            "metadata": metadata or {}
        }
        self._append_record(payload=payload, previous_hash=last_record["current_hash"])
        return self.chain[-1]["current_hash"]

    def verify_integrity(self) -> bool:
        """
        Validates the entire history of the record without error.
        Returns True if all hashes are valid, False if corruption is detected.
        """
        if len(self.chain) < 2:
            return True
        
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]
            
            # Check if previous hash matches exactly
            if current["previous_hash"] != previous["current_hash"]:
                print(f"[CRITICAL ERROR] State corruption detected at block {i}!")
                print(f"  Expected: {previous['current_hash']}")
                print(f"  Got: {current['previous_hash']}")
                return False
            
            # Verify current hash is correct using the stored record data
            expected_hash = self._generate_hash(current)
            if current["current_hash"] != expected_hash:
                print(f"[CRITICAL ERROR] Hash mismatch at block {i}!")
                print(f"  Expected: {expected_hash}")
                print(f"  Got: {current['current_hash']}")
                return False
        
        print("[System Integrity] All records verified. Zero errors found.")
        return True

    def get_record_by_hash(self, target_hash: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific record by its hash."""
        for record in self.chain:
            if record["current_hash"] == target_hash:
                return record
        return None

    def get_records_since(self, timestamp: str) -> List[Dict[str, Any]]:
        """Returns all records after a given ISO timestamp."""
        return [
            r for r in self.chain 
            if r["timestamp"] > timestamp
        ]

    def replay_to_state(self, block_index: int) -> Dict[str, Any]:
        """
        Replays the ledger up to a specific block index to reconstruct state.
        Returns the topology snapshot at that point.
        """
        if block_index < 0 or block_index >= len(self.chain):
            raise IndexError(f"Block index {block_index} out of range")
        
        # Replay all events up to the target block
        latest_topology = {}
        for i in range(1, block_index + 1):
            record = self.chain[i]
            payload = record["payload"]
            if "topology_snapshot" in payload:
                if "nodes" in payload["topology_snapshot"]:
                    latest_topology = payload["topology_snapshot"]
        
        return latest_topology

    def export_to_file(self, filepath: str):
        """Exports the entire ledger to a JSON file."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.chain, f, indent=2)
        print(f"[Ledger] Exported {len(self.chain)} records to {filepath}")

    @classmethod
    def load_from_file(cls, filepath: str) -> 'ImmutableLedger':
        """Loads a ledger from a JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            chain = json.load(f)
        
        ledger = cls.__new__(cls)
        ledger.chain = chain
        
        # Verify integrity on load
        if not ledger.verify_integrity():
            raise ValueError("Loaded ledger failed integrity check!")
        
        return ledger

    def __len__(self) -> int:
        return len(self.chain)

    def __str__(self) -> str:
        return f"ImmutableLedger(records={len(self.chain)}, integrity={'verified' if self.verify_integrity() else 'CORRUPTED'})"
