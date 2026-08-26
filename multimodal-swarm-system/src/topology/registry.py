"""
Topology Registry Module
Maps and preserves agent relationships in the swarm system.
"""

from typing import Dict, Any, List, Optional


class TopologyNode:
    """Represents a unique agent and its current operational methodology."""
    
    def __init__(self, agent_id: str, agent_type: str, methodology: str):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.methodology = methodology
        self.connected_to: List[str] = []

    def link_to(self, target_agent_id: str) -> bool:
        """
        Maps relationship pathways between swarm agents.
        Returns True if link was added, False if already exists.
        """
        if target_agent_id not in self.connected_to:
            self.connected_to.append(target_agent_id)
            return True
        return False

    def unlink_from(self, target_agent_id: str) -> bool:
        """Removes a connection from this node."""
        if target_agent_id in self.connected_to:
            self.connected_to.remove(target_agent_id)
            return True
        return False

    def to_dict(self) -> Dict[str, Any]:
        """Serializes node state for storage or transmission."""
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "methodology": self.methodology,
            "connections": self.connected_to
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TopologyNode':
        """Deserializes node state from dictionary."""
        node = cls(
            agent_id=data["agent_id"],
            agent_type=data["agent_type"],
            methodology=data["methodology"]
        )
        node.connected_to = data.get("connections", [])
        return node


class TopologyRegistry:
    """
    Central registry for managing all agent topologies.
    Tracks dynamic agent networks and their interconnections.
    """
    
    def __init__(self):
        self.nodes: Dict[str, TopologyNode] = {}

    def register_node(self, node: TopologyNode) -> bool:
        """
        Registers a new agent node in the topology.
        Returns False if node already exists.
        """
        if node.agent_id in self.nodes:
            return False
        self.nodes[node.agent_id] = node
        return True

    def get_node(self, agent_id: str) -> Optional[TopologyNode]:
        """Retrieves a node by its ID."""
        return self.nodes.get(agent_id)

    def remove_node(self, agent_id: str) -> bool:
        """
        Removes a node from the registry.
        Also removes any connections pointing to this node.
        """
        if agent_id not in self.nodes:
            return False
        
        # Remove incoming connections from other nodes
        for node in self.nodes.values():
            node.unlink_from(agent_id)
        
        del self.nodes[agent_id]
        return True

    def link_agents(self, source_id: str, target_id: str) -> bool:
        """Creates a directed link between two agents."""
        source = self.get_node(source_id)
        if source is None:
            return False
        return source.link_to(target_id)

    def get_topology_snapshot(self) -> Dict[str, Any]:
        """Returns a complete snapshot of the current topology state."""
        import copy
        return {
            "node_count": len(self.nodes),
            "nodes": {nid: copy.deepcopy(node.to_dict()) for nid, node in self.nodes.items()}
        }

    def find_connected_components(self) -> List[List[str]]:
        """Finds all connected components in the topology graph."""
        visited = set()
        components = []
        
        def dfs(node_id: str, component: List[str]):
            visited.add(node_id)
            component.append(node_id)
            node = self.get_node(node_id)
            if node:
                for neighbor in node.connected_to:
                    if neighbor not in visited:
                        dfs(neighbor, component)
        
        for node_id in self.nodes:
            if node_id not in visited:
                component: List[str] = []
                dfs(node_id, component)
                components.append(component)
        
        return components
