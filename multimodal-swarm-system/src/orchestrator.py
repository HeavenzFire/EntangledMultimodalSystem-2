"""
Orchestrator Module
Coordinates agent execution and manages the topology registry with immutable ledger logging.
"""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import Dict, Any, List, Optional
from topology.registry import TopologyNode, TopologyRegistry
from telemetry.ledger import ImmutableLedger
from agents import BaseAgent, CoderAgent, VisionAgent
from gateway import Gateway


class Orchestrator:
    """
    Central coordinator for the swarm system.
    Manages agent lifecycle, topology registration, and event logging.
    """
    
    def __init__(self):
        self.registry = TopologyRegistry()
        self.ledger = ImmutableLedger()
        self.gateway = Gateway()
        self.agents: Dict[str, BaseAgent] = {}
        
        # Log initialization
        self.ledger.commit_event(
            event_type="system_init",
            data={"status": "orchestrator_initialized"}
        )
    
    def register_agent(self, agent: BaseAgent) -> bool:
        """
        Registers an agent in both the topology registry and local management.
        Logs the registration event to the immutable ledger.
        """
        if agent.agent_id in self.agents:
            return False
        
        # Add to local management
        self.agents[agent.agent_id] = agent
        
        # Create and register topology node
        node = TopologyNode(
            agent_id=agent.agent_id,
            agent_type=agent.agent_type,
            methodology=agent.methodology
        )
        self.registry.register_node(node)
        
        # Log to ledger
        self.ledger.commit_state(
            topology_snapshot=self.registry.get_topology_snapshot(),
            operational_event=f"Agent registered: {agent.agent_id}",
            metadata={
                "agent_type": agent.agent_type,
                "methodology": agent.methodology
            }
        )
        
        return True
    
    def link_agents(self, source_id: str, target_id: str) -> bool:
        """
        Creates a connection between two agents.
        Logs the topology change to the ledger.
        """
        success = self.registry.link_agents(source_id, target_id)
        
        if success:
            self.ledger.commit_state(
                topology_snapshot=self.registry.get_topology_snapshot(),
                operational_event=f"Link created: {source_id} -> {target_id}",
                metadata={"source": source_id, "target": target_id}
            )
        
        return success
    
    def execute_agent(self, agent_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes an agent with the given input data.
        Logs the execution event and result to the ledger.
        """
        if agent_id not in self.agents:
            return {"status": "error", "message": f"Agent {agent_id} not found"}
        
        agent = self.agents[agent_id]
        
        # Log pre-execution state
        self.ledger.commit_event(
            event_type="agent_execution_start",
            data={
                "agent_id": agent_id,
                "input": input_data
            },
            metadata={"agent_state": agent.get_state()}
        )
        
        # Execute agent
        result = agent.execute(input_data)
        
        # Log post-execution state
        self.ledger.commit_state(
            topology_snapshot=self.registry.get_topology_snapshot(),
            operational_event=f"Agent execution complete: {agent_id}",
            metadata={
                "result_status": result.get("status"),
                "agent_state": agent.get_state()
            }
        )
        
        return result
    
    def get_system_status(self) -> Dict[str, Any]:
        """Returns comprehensive system status."""
        return {
            "gateway": self.gateway.health_check(),
            "topology": self.registry.get_topology_snapshot(),
            "ledger_integrity": self.ledger.verify_integrity(),
            "ledger_length": len(self.ledger),
            "registered_agents": list(self.agents.keys())
        }
    
    def export_ledger(self, filepath: str):
        """Exports the immutable ledger to a JSON file."""
        self.ledger.export_to_file(filepath)
    
    def verify_system_integrity(self) -> bool:
        """Verifies the integrity of the entire system state."""
        return self.ledger.verify_integrity()


def run_demo():
    """Demonstrates the orchestrator with agent coordination and ledger logging."""
    print("=" * 60)
    print("MULTIMODAL SWARM SYSTEM - DEMONSTRATION")
    print("=" * 60)
    
    # Initialize orchestrator
    orchestrator = Orchestrator()
    
    # Create agents
    coder = CoderAgent("coder_01")
    vision = VisionAgent("vision_01")
    
    # Register agents
    print("\n[1] Registering agents...")
    orchestrator.register_agent(coder)
    orchestrator.register_agent(vision)
    print(f"    Registered: coder_01 (CoderAgent)")
    print(f"    Registered: vision_01 (VisionAgent)")
    
    # Link agents (vision feeds into coder)
    print("\n[2] Creating agent topology...")
    # Note: vision_01 was already linked to coder_01 during registration via TopologyNode
    # Let's create a new link to demonstrate the functionality
    orchestrator.link_agents("coder_01", "vision_01")  # Bidirectional link
    print("    Linked: coder_01 -> vision_01 (bidirectional)")
    
    # Execute vision agent
    print("\n[3] Executing VisionAgent...")
    vision_result = orchestrator.execute_agent(
        "vision_01",
        {"analysis_type": "layout", "image_path": "mockup.png"}
    )
    print(f"    Result: {vision_result['status']}")
    print(f"    Extracted tokens: {vision_result.get('extracted_tokens', [])}")
    
    # Execute coder agent
    print("\n[4] Executing CoderAgent...")
    coder_result = orchestrator.execute_agent(
        "coder_01",
        {"task": "generate_class", "specification": {"name": "LoginComponent"}}
    )
    print(f"    Result: {coder_result['status']}")
    print(f"    Output: {coder_result.get('output', '')}")
    
    # System status
    print("\n[5] System Status:")
    status = orchestrator.get_system_status()
    print(f"    Gateway: {status['gateway']['status']}")
    print(f"    Agents registered: {len(status['registered_agents'])}")
    print(f"    Ledger records: {status['ledger_length']}")
    
    # Verify integrity
    print("\n[6] Verifying system integrity...")
    if orchestrator.verify_system_integrity():
        print("    ✓ All records verified. Zero errors found.")
    else:
        print("    ✗ Integrity check failed!")
    
    # Export ledger
    print("\n[7] Exporting ledger...")
    export_path = "/workspace/multimodal-swarm-system/ledger_export.json"
    orchestrator.export_ledger(export_path)
    
    print("\n" + "=" * 60)
    print("DEMONSTRATION COMPLETE")
    print("=" * 60)
    
    return orchestrator


if __name__ == "__main__":
    run_demo()
