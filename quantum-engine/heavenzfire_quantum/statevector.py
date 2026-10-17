"""Small, bounded pure-Python state-vector simulator.

Convention: qubit 0 is the least-significant bit of each basis-state index.
This is a classical simulator for quantum circuit mathematics, not quantum hardware.
No third-party dependencies are required.
"""
from __future__ import annotations

import math
import random
from typing import Dict, List


class StateVector:
    """State-vector simulator with H, RY, CNOT, probabilities and sampling."""

    def __init__(self, n_qubits: int, max_qubits: int = 10) -> None:
        if isinstance(n_qubits, bool) or not isinstance(n_qubits, int):
            raise TypeError("n_qubits must be an integer")
        if not isinstance(max_qubits, int) or max_qubits < 1:
            raise ValueError("max_qubits must be a positive integer")
        if n_qubits < 1 or n_qubits > max_qubits:
            raise ValueError("n_qubits must be between 1 and max_qubits")
        self.n_qubits = n_qubits
        self._size = 1 << n_qubits
        self.amplitudes: List[complex] = [0j] * self._size
        self.amplitudes[0] = 1.0 + 0j

    def _check_qubit(self, qubit: int) -> None:
        if isinstance(qubit, bool) or not isinstance(qubit, int):
            raise TypeError("qubit index must be an integer")
        if qubit < 0 or qubit >= self.n_qubits:
            raise ValueError("qubit index is out of range")

    def _apply_single(self, qubit: int, a: complex, b: complex,
                      c: complex, d: complex) -> "StateVector":
        self._check_qubit(qubit)
        mask = 1 << qubit
        for base in range(self._size):
            if base & mask:
                continue
            other = base | mask
            x0 = self.amplitudes[base]
            x1 = self.amplitudes[other]
            self.amplitudes[base] = a * x0 + b * x1
            self.amplitudes[other] = c * x0 + d * x1
        return self

    def h(self, qubit: int) -> "StateVector":
        """Apply the Hadamard gate."""
        scale = 1.0 / math.sqrt(2.0)
        return self._apply_single(qubit, scale, scale, scale, -scale)

    def ry(self, qubit: int, theta: float) -> "StateVector":
        """Apply a real Y-axis rotation by theta radians."""
        if not isinstance(theta, (int, float)) or not math.isfinite(theta):
            raise ValueError("theta must be a finite number")
        half = float(theta) / 2.0
        cosine, sine = math.cos(half), math.sin(half)
        return self._apply_single(qubit, cosine, -sine, sine, cosine)

    def cnot(self, control: int, target: int) -> "StateVector":
        """Apply controlled-NOT; control and target must be distinct."""
        self._check_qubit(control)
        self._check_qubit(target)
        if control == target:
            raise ValueError("control and target must be different qubits")
        control_mask = 1 << control
        target_mask = 1 << target
        for base in range(self._size):
            if base & control_mask and not base & target_mask:
                other = base | target_mask
                self.amplitudes[base], self.amplitudes[other] = (
                    self.amplitudes[other], self.amplitudes[base]
                )
        return self

    def probabilities(self) -> List[float]:
        """Return basis-state probabilities, normalizing only tiny roundoff."""
        values = [float((amp.conjugate() * amp).real) for amp in self.amplitudes]
        total = math.fsum(values)
        if not math.isfinite(total) or abs(total - 1.0) > 1e-9:
            raise ArithmeticError("state vector is not normalized")
        return [value / total for value in values]

    def expectation_z(self, qubit: int) -> float:
        """Return the Pauli-Z expectation value for one qubit."""
        self._check_qubit(qubit)
        mask = 1 << qubit
        probs = self.probabilities()
        return math.fsum(p if not (i & mask) else -p
                         for i, p in enumerate(probs))

    def sample(self, shots: int = 1024, seed: int = 0) -> Dict[str, int]:
        """Sample computational-basis measurements reproducibly."""
        if isinstance(shots, bool) or not isinstance(shots, int) or shots < 1:
            raise ValueError("shots must be a positive integer")
        if isinstance(seed, bool) or not isinstance(seed, int):
            raise TypeError("seed must be an integer")
        probs = self.probabilities()
        rng = random.Random(seed)
        outcomes = [format(i, "0{}b".format(self.n_qubits))
                    for i in range(self._size)]
        counts: Dict[str, int] = {}
        for _ in range(shots):
            value = rng.random()
            cumulative = 0.0
            chosen = self._size - 1
            for i, probability in enumerate(probs):
                cumulative += probability
                if value < cumulative:
                    chosen = i
                    break
            bitstring = outcomes[chosen]
            counts[bitstring] = counts.get(bitstring, 0) + 1
        return counts
