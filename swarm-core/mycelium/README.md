# HeavenzFire Living Field / Mycelium

This directory contains two separate layers:

- `IntelligentPixelMesh`: deterministic, bounded grid simulation for local neighbor signals and colony growth.
- `MyceliumTaskRouter`: task-routing coordinator that selects among explicitly registered worker adapters by capability, load, and recent failures.

The task router does **not** execute shell commands and does not itself authenticate users. Its injected `dispatch(task, worker)` function is a trust boundary: production adapters must authenticate the caller, apply an allowlist/policy check, validate task payloads, enforce least privilege, and record their own execution audit. Register only workers that are reachable through that controlled adapter.

## Run tests

From the repository root with Node.js 18 or later:

```powershell
node swarm-core/mycelium/test-intelligent-pixel-mesh.js
node swarm-core/mycelium/test-task-router.js
```

The tests use Node's built-in assertion library and no third-party packages. They exercise deterministic simulation behavior and the task router against a mocked dispatch adapter. They do not prove connectivity to the Windows services, Ollama, cloud agents, or the existing Legion broadcast bus.

## Routing behavior and limits

- Only registered, healthy workers with the requested capability are eligible.
- A task ID is idempotent within the lifetime of this router instance.
- Dispatch attempts are bounded by `maxRetries`; worker calls have a timeout.
- Repeated worker failures open a temporary circuit.
- Task and worker events are retained in a bounded in-memory audit buffer.
- State is in-memory only: no persistence, cross-process deduplication, authenticated transport, distributed consensus, or real multi-node discovery is implemented here.
- A timed-out promise cannot forcibly stop the underlying worker operation. The adapter must enforce its own cancellation/timeout semantics and use idempotency keys for side-effecting work.
