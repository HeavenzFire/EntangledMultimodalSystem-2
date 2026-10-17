# HeavenzFire Quantum Engine v0.1

A small, dependency-free reference state-vector simulator intended as a
verifiable foundation for future HeavenzFire swarm experiments.

## Scope and limits

- Implements Hadamard (H), Y rotation (RY), controlled-NOT (CNOT), basis
  probabilities, Pauli-Z expectation values, and seeded measurement sampling.
- Uses classical Python complex numbers and a CPU state vector. **It does not
  execute on quantum hardware and does not demonstrate quantum advantage.**
- The default maximum is 10 qubits. State-vector memory and computation grow
  exponentially with qubit count; the explicit bound prevents accidental
  resource-heavy runs.
- Qubit 0 is the least-significant bit in basis-state indices. Sampled bitstrings
  are displayed most-significant bit first.
- Uses only the Python standard library, so tests do not need Qiskit, NumPy,
  network access, or package installation.

## Run tests

From this directory:

```powershell
python -m unittest discover -s tests -v
```

## Initial verification cases

The tests cover the zero state, equal superposition, a pi Y-rotation, a two-qubit
Bell-state circuit, reproducible sampling, and invalid-input/resource guards.

## Next integration stage

Keep this engine isolated until its tests pass in CI. A subsequent adapter can
map bounded swarm task scores to circuit parameters and compare its decisions
against a deterministic classical baseline. Do not let stochastic outputs
directly authorize shell commands, deployments, network exposure, or destructive
actions; the existing deterministic policy gate must retain execution authority.
