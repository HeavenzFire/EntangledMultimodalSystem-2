'use strict';

/**
 * Living Field task router.
 *
 * The field selects among explicitly registered worker adapters; it does not
 * execute shell commands or grant permissions. The injected dispatch function
 * is the only execution boundary and should call an authenticated, policy-gated
 * worker/orchestrator adapter.
 */
class MyceliumTaskRouter {
  constructor(options = {}) {
    if (!options.mesh || typeof options.mesh.snapshot !== 'function') {
      throw new TypeError('mesh with snapshot() is required');
    }
    if (typeof options.dispatch !== 'function') {
      throw new TypeError('dispatch(task, worker) adapter is required');
    }
    this.mesh = options.mesh;
    this.dispatch = options.dispatch;
    this.timeoutMs = options.timeoutMs === undefined ? 5000 : options.timeoutMs;
    this.maxRetries = options.maxRetries === undefined ? 1 : options.maxRetries;
    this.failureThreshold = options.failureThreshold === undefined ? 3 : options.failureThreshold;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1 ||
        !Number.isInteger(this.maxRetries) || this.maxRetries < 0 || this.maxRetries > 5 ||
        !Number.isInteger(this.failureThreshold) || this.failureThreshold < 1) {
      throw new RangeError('invalid timeout, retry, or circuit-breaker configuration');
    }
    this.workers = new Map();
    this.tasks = new Map();
    this.events = [];
    this.maxEvents = 1000;
  }

  registerWorker(worker) {
    if (!worker || typeof worker.id !== 'string' || !worker.id.trim() ||
        !Array.isArray(worker.capabilities) || worker.capabilities.length === 0 ||
        worker.capabilities.some(c => typeof c !== 'string' || !c.trim())) {
      throw new TypeError('worker requires id and non-empty string capabilities');
    }
    this.workers.set(worker.id, {
      id: worker.id,
      capabilities: [...new Set(worker.capabilities)],
      healthy: worker.healthy !== false,
      failures: 0,
      inFlight: 0,
      openedUntil: 0
    });
    this._event('worker:registered', { workerId: worker.id });
  }

  setWorkerHealth(workerId, healthy) {
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error('unknown worker: ' + workerId);
    worker.healthy = Boolean(healthy);
    if (worker.healthy) {
      worker.failures = 0;
      worker.openedUntil = 0;
    }
    this._event('worker:health', { workerId, healthy: worker.healthy });
  }

  _event(type, data) {
    this.events.push({ type, at: Date.now(), ...data });
    if (this.events.length > this.maxEvents) this.events.shift();
  }

  _eligible(task) {
    const now = Date.now();
    const field = this.mesh.snapshot();
    const density = Math.max(1, field.agents || 1);
    return Array.from(this.workers.values())
      .filter(w => w.healthy && w.capabilities.includes(task.type) &&
        (w.openedUntil === 0 || w.openedUntil <= now))
      .map(w => ({
        worker: w,
        // Lower score is preferred: penalize queue pressure and recent failures.
        score: (w.inFlight * 2) + (w.failures * 3) +
          ((field.agents || 1) / density) * 0.001
      }))
      .sort((a, b) => a.score - b.score || a.worker.id.localeCompare(b.worker.id));
  }

  async submit(task) {
    if (!task || typeof task.id !== 'string' || !task.id.trim() ||
        typeof task.type !== 'string' || !task.type.trim() ||
        !Object.prototype.hasOwnProperty.call(task, 'payload')) {
      throw new TypeError('task requires id, type, and payload');
    }
    if (this.tasks.has(task.id)) {
      this._event('task:deduplicated', { taskId: task.id });
      return this.tasks.get(task.id);
    }

    const record = { id: task.id, type: task.type, status: 'queued', attempts: 0, workerId: null };
    this.tasks.set(task.id, record);
    this._event('task:queued', { taskId: task.id, taskType: task.type });

    const candidates = this._eligible(task);
    if (!candidates.length) {
      record.status = 'unavailable';
      record.error = 'No healthy registered worker supports task type';
      this._event('task:unavailable', { taskId: task.id });
      return { ...record };
    }

    record.status = 'running';
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const current = this._eligible(task);
      const chosen = current[0] && current[0].worker;
      if (!chosen) break;
      record.attempts++;
      record.workerId = chosen.id;
      chosen.inFlight++;
      this._event('task:dispatch', { taskId: task.id, workerId: chosen.id, attempt: record.attempts });
      try {
        const result = await this._withTimeout(
          Promise.resolve().then(() => this.dispatch({ ...task }, { id: chosen.id, capabilities: [...chosen.capabilities] })),
          this.timeoutMs
        );
        chosen.failures = 0;
        chosen.openedUntil = 0;
        record.status = 'completed';
        record.result = result;
        this._event('task:completed', { taskId: task.id, workerId: chosen.id });
        return { ...record };
      } catch (error) {
        lastError = error;
        chosen.failures++;
        if (chosen.failures >= this.failureThreshold) {
          chosen.openedUntil = Date.now() + this.timeoutMs;
          this._event('worker:circuit-open', { workerId: chosen.id, failures: chosen.failures });
        }
        this._event('task:attempt-failed', {
          taskId: task.id, workerId: chosen.id, message: String(error && error.message || error)
        });
      } finally {
        chosen.inFlight = Math.max(0, chosen.inFlight - 1);
      }
    }
    record.status = 'failed';
    record.error = String(lastError && lastError.message || lastError || 'No eligible worker remained');
    this._event('task:failed', { taskId: task.id });
    return { ...record };
  }

  _withTimeout(promise, ms) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('worker timeout after ' + ms + 'ms')), ms);
      })
    ]).finally(() => clearTimeout(timer));
  }

  getStatus() {
    return {
      workers: Array.from(this.workers.values()).map(w => ({
        id: w.id, capabilities: [...w.capabilities], healthy: w.healthy,
        failures: w.failures, inFlight: w.inFlight,
        circuitOpen: w.openedUntil > Date.now()
      })),
      tasks: Array.from(this.tasks.values()).map(t => ({ ...t })),
      events: this.events.map(e => ({ ...e }))
    };
  }
}

module.exports = { MyceliumTaskRouter };
