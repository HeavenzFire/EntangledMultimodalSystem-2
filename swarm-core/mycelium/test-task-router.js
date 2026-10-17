'use strict';
const assert = require('node:assert/strict');
const { IntelligentPixelMesh } = require('./intelligent-pixel-mesh');
const { MyceliumTaskRouter } = require('./task-router');

async function main() {
  const mesh = new IntelligentPixelMesh({ width: 12, height: 10, seed: 369 });
  const calls = [];
  const router = new MyceliumTaskRouter({
    mesh, timeoutMs: 30, maxRetries: 1, failureThreshold: 1,
    dispatch: async (task, worker) => {
      calls.push({ taskId: task.id, workerId: worker.id });
      if (worker.id === 'bad') throw new Error('simulated worker fault');
      return { accepted: true, output: 'mocked', taskId: task.id };
    }
  });
  router.registerWorker({ id: 'bad', capabilities: ['test'] });
  router.registerWorker({ id: 'good', capabilities: ['test'] });

  const first = await router.submit({ id: 't-1', type: 'test', payload: { value: 1 } });
  assert.equal(first.status, 'completed');
  assert.ok(first.attempts >= 1 && first.attempts <= 2);
  assert.equal(first.result.accepted, true);
  assert.equal((await router.submit({ id: 't-1', type: 'test', payload: { value: 999 } })).attempts, first.attempts,
    'duplicate task id must not execute again');
  assert.equal(calls.filter(c => c.taskId === 't-1').length, first.attempts);

  const unavailable = await router.submit({ id: 't-2', type: 'unknown', payload: null });
  assert.equal(unavailable.status, 'unavailable');

  const status = router.getStatus();
  assert.ok(status.events.some(e => e.type === 'task:completed'));
  assert.ok(status.events.some(e => e.type === 'task:deduplicated'));
  assert.ok(status.workers.every(w => w.inFlight === 0));
  console.log('PASS: bounded routing, capability filtering, task idempotency, fault recovery, and audit events');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
