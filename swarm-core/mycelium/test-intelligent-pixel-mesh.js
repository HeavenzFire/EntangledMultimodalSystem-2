'use strict';
const assert = require('node:assert/strict');
const { IntelligentPixelMesh } = require('./intelligent-pixel-mesh');

const a = new IntelligentPixelMesh({ width: 20, height: 12, maxAgents: 90, seed: 123 });
const b = new IntelligentPixelMesh({ width: 20, height: 12, maxAgents: 90, seed: 123 });
assert.equal(a.snapshot().agents, 1, 'starts with one colony seed');
const first = a.run(30);
const second = b.run(30);
assert.deepEqual(first, second, 'same seed and steps must reproduce the same state');
assert.ok(first.agents > 1, 'colony should grow from its seed');
assert.ok(first.agents <= first.maxAgents, 'growth respects configured cap');
assert.equal(first.cells.length, first.width * first.height);
assert.ok(first.food.length >= 2, 'nutrient sources are present');
assert.ok(first.cells.every(c => Number.isFinite(c.signal) && c.signal >= 0), 'signals remain finite and nonnegative');
assert.throws(() => new IntelligentPixelMesh({ width: 2, height: 2 }), RangeError);
assert.throws(() => a.run(10001), RangeError);
console.log('PASS: deterministic growth, nutrient signals, agent cap, state shape, and input bounds');
