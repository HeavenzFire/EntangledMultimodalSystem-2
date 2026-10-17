(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HeavenzFireMycelium = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function seededRandom(seed) {
    let state = (seed >>> 0) || 1;
    return function () {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  class IntelligentPixelMesh {
    constructor(options = {}) {
      this.width = options.width || 64;
      this.height = options.height || 40;
      this.maxAgents = options.maxAgents || Math.floor(this.width * this.height * 0.38);
      this.seed = options.seed === undefined ? 369 : options.seed;
      if (!Number.isInteger(this.width) || !Number.isInteger(this.height) ||
          this.width < 5 || this.height < 5 || this.width * this.height > 20000) {
        throw new RangeError('grid must be integer dimensions from 5x5 to 20000 cells total');
      }
      if (!Number.isInteger(this.maxAgents) || this.maxAgents < 1 ||
          this.maxAgents > this.width * this.height) {
        throw new RangeError('maxAgents must fit inside the grid');
      }
      this.random = seededRandom(this.seed);
      this.tick = 0;
      this.cells = new Array(this.width * this.height).fill(null).map((_, index) => ({
        index, x: index % this.width, y: Math.floor(index / this.width),
        occupied: false, energy: 0, trail: 0, signal: 0, parent: -1, age: 0
      }));
      this.food = [];
      this.agents = 0;
      this._placeFood(Math.max(2, Math.floor((this.width * this.height) / 700)));
      this._seedColony();
      this._diffuseSignal();
    }

    _placeFood(count) {
      for (let i = 0; i < count; i++) {
        const marginX = Math.max(1, Math.floor(this.width * 0.08));
        const marginY = Math.max(1, Math.floor(this.height * 0.08));
        const x = marginX + Math.floor(this.random() * Math.max(1, this.width - marginX * 2));
        const y = marginY + Math.floor(this.random() * Math.max(1, this.height - marginY * 2));
        const index = y * this.width + x;
        if (!this.food.includes(index)) this.food.push(index);
      }
    }

    _seedColony() {
      const x = Math.floor(this.width / 2);
      const y = Math.floor(this.height / 2);
      const cell = this.cells[y * this.width + x];
      cell.occupied = true;
      cell.energy = 1;
      cell.trail = 1;
      this.agents = 1;
    }

    _neighbors(cell) {
      const result = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const x = cell.x + dx, y = cell.y + dy;
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            result.push(this.cells[y * this.width + x]);
          }
        }
      }
      return result;
    }

    _diffuseSignal() {
      const next = this.cells.map(cell => cell.signal * 0.91);
      for (const index of this.food) next[index] = Math.min(1, next[index] + 0.85);
      for (const cell of this.cells) {
        if (cell.signal <= 0.001) continue;
        const neighbors = this._neighbors(cell);
        const share = cell.signal * 0.045;
        for (const neighbor of neighbors) next[neighbor.index] = Math.min(1, next[neighbor.index] + share);
      }
      for (let i = 0; i < this.cells.length; i++) this.cells[i].signal = next[i];
    }

    step() {
      this.tick++;
      this._diffuseSignal();
      const candidates = [];
      for (const cell of this.cells) {
        if (!cell.occupied) continue;
        cell.age++;
        cell.energy = Math.min(2, cell.energy + (this.food.includes(cell.index) ? 0.28 : -0.004));
        cell.trail = Math.max(0, cell.trail * 0.985);
        for (const neighbor of this._neighbors(cell)) {
          if (neighbor.occupied) continue;
          const neighborsOfNeighbor = this._neighbors(neighbor);
          const crowding = neighborsOfNeighbor.filter(n => n.occupied).length;
          const score = neighbor.signal * 1.7 + (this.food.includes(neighbor.index) ? 2 : 0)
            + Math.min(crowding, 3) * 0.09 + this.random() * 0.12;
          candidates.push({ parent: cell, target: neighbor, score });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      const claimed = new Set();
      let grown = 0;
      const growthBudget = Math.max(1, Math.ceil(this.agents * 0.035));
      for (const candidate of candidates) {
        if (grown >= growthBudget || this.agents >= this.maxAgents) break;
        const target = candidate.target;
        if (target.occupied || claimed.has(target.index)) continue;
        // Require either nutrient signal or proximity to an existing branch.
        if (target.signal < 0.025 && candidate.score < 0.22) continue;
        target.occupied = true;
        target.energy = 0.55 + Math.min(0.4, target.signal * 0.4);
        target.trail = 0.75;
        target.parent = candidate.parent.index;
        target.age = 0;
        claimed.add(target.index);
        this.agents++;
        grown++;
      }
      // Starvation pruning removes only weak leaf pixels; it does not erase the seed.
      for (const cell of this.cells) {
        if (!cell.occupied || cell.age < 14 || cell.energy >= 0.18) continue;
        const hasChildren = this.cells.some(other => other.occupied && other.parent === cell.index);
        if (!hasChildren && this.agents > 1) {
          cell.occupied = false;
          cell.energy = 0;
          cell.trail = 0;
          cell.parent = -1;
          this.agents--;
        }
      }
      return this.snapshot();
    }

    run(steps = 1) {
      if (!Number.isInteger(steps) || steps < 0 || steps > 10000) {
        throw new RangeError('steps must be an integer between 0 and 10000');
      }
      for (let i = 0; i < steps; i++) this.step();
      return this.snapshot();
    }

    snapshot() {
      return {
        tick: this.tick, width: this.width, height: this.height,
        agents: this.agents, maxAgents: this.maxAgents,
        food: this.food.slice(),
        cells: this.cells.map(c => ({
          x: c.x, y: c.y, occupied: c.occupied,
          energy: Number(c.energy.toFixed(4)), signal: Number(c.signal.toFixed(4)),
          trail: Number(c.trail.toFixed(4)), parent: c.parent, age: c.age
        }))
      };
    }
  }

  return { IntelligentPixelMesh };
});
