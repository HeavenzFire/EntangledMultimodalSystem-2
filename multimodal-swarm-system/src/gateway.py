"""
Gateway Module
Entry point for external requests into the swarm system.
"""

from typing import Dict, Any, Optional


class Gateway:
    """
    Handles incoming requests and routes them to appropriate agents.
    Provides a unified interface for external systems.
    """
    
    def __init__(self):
        self.request_count = 0
        self.active = True
    
    def receive_request(self, request_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receives and validates incoming requests.
        Returns a response dictionary with status and data.
        """
        if not self.active:
            return {"status": "error", "message": "Gateway is inactive"}
        
        self.request_count += 1
        
        # Basic validation
        if not request_type:
            return {"status": "error", "message": "Missing request type"}
        
        return {
            "status": "received",
            "request_id": f"req_{self.request_count}",
            "request_type": request_type,
            "payload": payload
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Returns gateway health status."""
        return {
            "status": "healthy",
            "active": self.active,
            "requests_processed": self.request_count
        }
    
    def shutdown(self):
        """Gracefully shuts down the gateway."""
        self.active = False
