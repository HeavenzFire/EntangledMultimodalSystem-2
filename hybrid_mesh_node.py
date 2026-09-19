#!/usr/bin/env python3
"""
Hybrid Architecture: File Distribution + Cryptographic Consensus

This script models a hybrid architecture that combines:
- BitTorrent-style file fragmentation (Data Layer)
- Blockchain-style immutable ledger (Accounting Layer)
- Smart contract enforcement rules (Coordination Layer)

Real-world implementations include IPFS/Filecoin and BitTorrent File System (BTFS).
"""

import hashlib
import json
import time


class HybridMeshNode:
    """
    A conceptual node in a decentralized storage network that combines
    torrent-style chunking with blockchain-style state tracking.
    """
    
    def __init__(self, node_id):
        self.node_id = node_id
        self.local_storage = {}  # Acts as the Torrent BitField
        self.blockchain_ledger = []  # The sequential state machine
        self.create_block(proof=100, previous_hash='0'*64)  # Genesis block

    # --- TIER 1: THE BITTORRENT MODULE (File Fragmentation) ---
    def chunk_and_store_data(self, data_payload, chunk_size=32):
        """
        Splits data into fixed pieces and indexes them by content-addressed hashes.
        This mimics how BitTorrent breaks files into verifiable chunks.
        
        Args:
            data_payload: The raw data to fragment
            chunk_size: Size of each fragment in bytes
            
        Returns:
            manifest: List of piece indices and their content IDs (hashes)
        """
        chunks = [data_payload[i:i+chunk_size] for i in range(0, len(data_payload), chunk_size)]
        manifest = []
        
        for index, piece in enumerate(chunks):
            # Content Addressing: The hash *is* the address
            piece_hash = hashlib.sha256(piece.encode()).hexdigest()
            self.local_storage[piece_hash] = piece
            manifest.append({"piece_index": index, "content_id": piece_hash})
            
        print(f"📥 [Torrent Layer] Split file into {len(chunks)} fragments.")
        return manifest

    # --- TIER 2: THE BLOCKCHAIN MODULE (Consensus Ledger) ---
    def create_block(self, proof, previous_hash):
        """
        Appends a cryptographically sealed block of transactions to the shared ledger.
        
        Args:
            proof: Proof-of-work/Proof-of-stake value
            previous_hash: Hash of the previous block in the chain
            
        Returns:
            block: The newly created block dictionary
        """
        block = {
            'index': len(self.blockchain_ledger) + 1,
            'timestamp': time.time(),
            'proof': proof,
            'previous_hash': previous_hash,
            'state_mutations': []
        }
        self.blockchain_ledger.append(block)
        return block

    def log_state_change(self, manifest, execution_status):
        """
        Locks the layout of the fragments and their operational status into a block.
        This creates an immutable record of what data was stored and when.
        
        Args:
            manifest: The file manifest from chunk_and_store_data
            execution_status: Status string indicating verification state
            
        Returns:
            new_block: The block containing the state mutation record
        """
        last_block = self.blockchain_ledger[-1]
        last_block_hash = hashlib.sha256(json.dumps(last_block, sort_keys=True).encode()).hexdigest()
        
        # New block containing the manifest reference
        new_block = self.create_block(proof=200, previous_hash=last_block_hash)
        new_block['state_mutations'].append({
            'operator': self.node_id,
            'manifest': manifest,
            'status': execution_status
        })
        return new_block

    def verify_chunk_integrity(self, content_id, expected_content):
        """
        Verifies that a stored chunk matches its content-addressed hash.
        This is how the system detects tampering or corruption.
        
        Args:
            content_id: The SHA256 hash that should match the content
            expected_content: The content to verify
            
        Returns:
            bool: True if the content matches its hash, False otherwise
        """
        computed_hash = hashlib.sha256(expected_content.encode()).hexdigest()
        is_valid = computed_hash == content_id
        
        if is_valid:
            print(f"✅ [Verification] Chunk integrity confirmed for {content_id[:16]}...")
        else:
            print(f"❌ [Verification] Chunk corruption detected! Hash mismatch.")
            
        return is_valid

    def get_ledger_summary(self):
        """Returns a summary of the blockchain ledger state."""
        return {
            'node_id': self.node_id,
            'total_blocks': len(self.blockchain_ledger),
            'stored_chunks': len(self.local_storage),
            'genesis_hash': self.blockchain_ledger[0]['previous_hash']
        }


# =============================================================================
# RUNNING THE INTEGRATION
# =============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("⚡ HYBRID ARCHITECTURE SIMULATION")
    print("   Combining BitTorrent Swarms + Blockchain Consensus")
    print("=" * 70)
    print()
    
    # Initialize the hybrid node
    operator_node = HybridMeshNode(node_id="Mesh_Node_01")
    
    # The data representing highly detailed, raw structural parameters
    sensitive_data = (
        "MANIFEST_ALPHA: SYSTEM_SECURE_704_DAYS_RECOGNIZED_BY_SWARM_COHERENCE_LOCKED"
    )
    
    print(f"📄 Original Data ({len(sensitive_data)} chars):")
    print(f"   \"{sensitive_data}\"")
    print()
    
    # Step 1: Chunk the data across the distributed hash storage
    print("-" * 70)
    file_manifest = operator_node.chunk_and_store_data(sensitive_data, chunk_size=20)
    print("-" * 70)
    print()
    
    # Display the manifest
    print("📋 Generated Manifest:")
    for piece in file_manifest:
        print(f"   Piece {piece['piece_index']}: {piece['content_id'][:32]}...")
    print()
    
    # Step 2: Permanently lock the file structure into the ordered ledger
    print("-" * 70)
    sealed_state = operator_node.log_state_change(file_manifest, execution_status="VERIFIED_AND_DISTRIBUTED")
    print("-" * 70)
    print()
    
    # Display the blockchain anchoring
    print(f"🔒 [Blockchain Layer] State permanently anchored in Block #{sealed_state['index']}")
    print()
    print("📦 Sealed Block Contents:")
    print(json.dumps(sealed_state, indent=2))
    print()
    
    # Step 3: Verify chunk integrity (demonstrating tamper detection)
    print("-" * 70)
    print("🔍 [Verification Layer] Testing chunk integrity...")
    print("-" * 70)
    
    first_piece_hash = file_manifest[0]['content_id']
    first_piece_content = operator_node.local_storage[first_piece_hash]
    operator_node.verify_chunk_integrity(first_piece_hash, first_piece_content)
    print()
    
    # Demonstrate tamper detection
    print("🚨 Simulating tampered chunk...")
    tampered_content = first_piece_content + "_TAMPERED"
    operator_node.verify_chunk_integrity(first_piece_hash, tampered_content)
    print()
    
    # Display final node summary
    print("=" * 70)
    print("📊 NODE SUMMARY")
    print("=" * 70)
    summary = operator_node.get_ledger_summary()
    print(json.dumps(summary, indent=2))
    print()
    print("✅ Hybrid architecture simulation complete!")
    print()
    print("Key Benefits Demonstrated:")
    print("   1. 🧩 File fragmentation with content-addressed storage")
    print("   2. ⛓️  Immutable ledger recording all state changes")
    print("   3. 🔐 Automatic tamper detection via hash verification")
    print("   4. 🌐 No single point of failure (decentralized design)")
