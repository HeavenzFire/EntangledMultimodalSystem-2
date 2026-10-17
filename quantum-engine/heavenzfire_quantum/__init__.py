"""HeavenzFire quantum simulation primitives.

This package simulates small quantum circuits on classical CPU state vectors.
It does not claim quantum-hardware execution.
"""
from .statevector import StateVector

__all__ = ["StateVector"]
