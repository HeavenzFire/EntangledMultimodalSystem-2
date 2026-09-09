/**
 * TIME-DILATED VORTEX SIMULATION
 * 
 * A vortex architect's playground for exploring life forms under extreme time dilation.
 * 
 * Core Concept:
 * - FAST LAYER: 1000x time acceleration (quantum fluctuations, micro-decisions)
 * - SLOW LAYER: 500x time deceleration (gravitational wells, evolutionary pressure)
 * - GRAVITY VARIABLE: Attractor field density and pull strength
 * - LIGHT VARIABLE: Information propagation speed and clarity
 * 
 * Life Forms Explored:
 * 1. QUANTUM FLICKER LIFE - Exists only in fast layer, dies in slow
 * 2. GRAVITATIONAL ANCHORS - Immovable objects in slow layer
 * 3. PHOTON SWARMS - Light-speed decision makers
 * 4. TEMPORAL BRIDGERS - Entities spanning both layers
 * 5. DILATION PREDATORS - Feed on time gradient energy
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ==================== TIME DILATION CONFIGURATION ====================

const TIME_DILATION_CONFIG = {
  // Time dilation factors
  FAST_LAYER_MULTIPLIER: 1000,    // 1 second real = 1000 seconds fast
  SLOW_LAYER_MULTIPLIER: 0.002,   // 1 second real = 0.002 seconds slow (500x slower)
  
  // Layer synchronization
  SYNC_INTERVAL_MS: 100,          // How often layers exchange state
  GRADIENT_SMOOTHING: 0.1,        // How much time gradients blend
  
  // Gravity parameters (affects attractor behavior)
  GRAVITY: {
    baseConstant: 6.674e-11,      // Real gravitational constant (scaled)
    vortexScale: 1e15,            // Scaling factor for vortex dynamics
    minGravityWell: 0.01,         // Minimum gravity to form a well
    maxGravityWell: 1000,         // Maximum gravity before collapse
    tidalForceThreshold: 0.5      // When tidal forces rip entities apart
  },
  
  // Light parameters (affects information flow)
  LIGHT: {
    baseSpeed: 299792458,         // Speed of light m/s (scaled)
    vortexScale: 1e-6,            // Scaling for simulation
    refractiveIndex: 1.0,         // Medium density (1.0 = vacuum)
    scatteringCoefficient: 0.01,  // How much light scatters
    absorptionRate: 0.001         // Information loss over distance
  },
  
  // Life formation thresholds
  LIFE_THRESHOLDS: {
    minComplexity: 0.3,           // Minimum pattern complexity for life
    minStability: 0.5,            // Minimum temporal stability
    minEnergyFlow: 0.1,           // Minimum energy throughput
    replicationThreshold: 0.8     // When entities can self-replicate
  },
  
  // Simulation bounds
  SIMULATION: {
    maxEntities: 10000,
    maxCycles: 1000000,
    tickRateMs: 16,               // ~60 FPS
    spatialDimensions: 3          // 2D or 3D simulation
  }
};

// ==================== SPATIOTEMPORAL MODELS ====================

/**
 * SpaceTimeCoordinate - Position in dilated vortex space
 */
class SpaceTimeCoordinate {
  constructor(x, y, z = 0, timeLayer = 'normal') {
    this.id = uuidv4();
    this.x = x;
    this.y = y;
    this.z = z;
    this.timeLayer = timeLayer; // 'fast', 'normal', 'slow'
    this.localTime = 0;         // Experienced time at this coordinate
    this.realTime = 0;          // Actual elapsed time
    this.gravityPotential = 0;  // Gravitational potential at this point
    this.lightIntensity = 1.0;  // Light/information availability
  }

  /**
   * Calculate proper time experienced at this coordinate
   * Uses simplified general relativity time dilation formula
   */
  calculateProperTime(realTimeElapsed, gravityWell = 0) {
    const c = TIME_DILATION_CONFIG.LIGHT.baseSpeed * TIME_DILATION_CONFIG.LIGHT.vortexScale;
    
    // Gravitational time dilation: t' = t * sqrt(1 - 2GM/rc²)
    const gravityFactor = gravityWell > 0 
      ? Math.sqrt(Math.max(0, 1 - (2 * gravityWell / (c * c))))
      : 1;
    
    // Apply layer multiplier
    let layerMultiplier = 1;
    if (this.timeLayer === 'fast') {
      layerMultiplier = TIME_DILATION_CONFIG.FAST_LAYER_MULTIPLIER;
    } else if (this.timeLayer === 'slow') {
      layerMultiplier = TIME_DILATION_CONFIG.SLOW_LAYER_MULTIPLIER;
    }
    
    return realTimeElapsed * layerMultiplier * gravityFactor;
  }

  /**
   * Distance to another coordinate (with time-weighted metric)
   */
  spatiotemporalDistance(other) {
    const spatialDist = Math.sqrt(
      Math.pow(this.x - other.x, 2) +
      Math.pow(this.y - other.y, 2) +
      Math.pow(this.z - other.z, 2)
    );
    
    const timeDist = Math.abs(this.localTime - other.localTime);
    const gravityDist = Math.abs(this.gravityPotential - other.gravityPotential);
    
    // Weighted metric combining space, time, and gravity
    return spatialDist + (timeDist * 0.5) + (gravityDist * 0.3);
  }

  toJSON() {
    return {
      id: this.id,
      position: [this.x, this.y, this.z],
      timeLayer: this.timeLayer,
      localTime: this.localTime,
      gravityPotential: this.gravityPotential,
      lightIntensity: this.lightIntensity
    };
  }
}

/**
 * GravityWell - Creates time dilation through mass/energy density
 */
class GravityWell {
  constructor(x, y, z, mass) {
    this.id = uuidv4();
    this.position = { x, y, z };
    this.mass = mass;
    this.radius = Math.cbrt(mass) * 0.1; // Approximate Schwarzschild-like radius
    this.eventHorizon = this.radius * 0.5;
    this.createdAt = Date.now();
    this.stability = 1.0;
    this.hawkingRadiation = 0;
    this.accretionDisk = []; // Entities orbiting this well
  }

  /**
   * Calculate gravitational pull at a distance
   */
  getGravityAtDistance(distance) {
    if (distance <= this.eventHorizon) {
      return Infinity; // Beyond event horizon
    }
    
    const G = TIME_DILATION_CONFIG.GRAVITY.baseConstant * TIME_DILATION_CONFIG.GRAVITY.vortexScale;
    return (G * this.mass) / Math.pow(distance, 2);
  }

  /**
   * Calculate time dilation factor at distance
   */
  getTimeDilationFactor(distance) {
    const gravity = this.getGravityAtDistance(distance);
    const c = TIME_DILATION_CONFIG.LIGHT.baseSpeed * TIME_DILATION_CONFIG.LIGHT.vortexScale;
    return Math.sqrt(Math.max(0, 1 - (2 * gravity / (c * c))));
  }

  /**
   * Add entity to accretion disk (orbiting entities)
   */
  captureEntity(entity) {
    if (!this.accretionDisk.find(e => e.id === entity.id)) {
      this.accretionDisk.push(entity);
      entity.orbitingWell = this.id;
    }
  }

  /**
   * Emit Hawking radiation (information leakage)
   */
  emitHawkingRadiation() {
    this.hawkingRadiation = Math.pow(this.mass, -1) * 0.001;
    this.stability -= this.hawkingRadiation * 0.01;
    if (this.stability <= 0) {
      this.evaporate();
    }
    return this.hawkingRadiation;
  }

  /**
   * Black hole evaporation
   */
  evaporate() {
    console.log(`[GRAVITY] Black hole ${this.id} evaporated via Hawking radiation`);
    this.stability = 0;
    this.mass = 0;
  }

  toJSON() {
    return {
      id: this.id,
      position: this.position,
      mass: this.mass,
      radius: this.radius,
      stability: this.stability,
      orbitingEntities: this.accretionDisk.length,
      hawkingRadiation: this.hawkingRadiation
    };
  }
}

/**
 * LightBeam - Carries information through the vortex
 */
class LightBeam {
  constructor(origin, direction, intensity = 1.0, data = {}) {
    this.id = uuidv4();
    this.origin = origin;
    this.direction = direction; // Normalized vector {x, y, z}
    this.intensity = intensity;
    this.data = data; // Information payload
    this.path = [origin];
    this.speed = TIME_DILATION_CONFIG.LIGHT.baseSpeed * TIME_DILATION_CONFIG.LIGHT.vortexScale;
    this.refractiveIndex = TIME_DILATION_CONFIG.LIGHT.refractiveIndex;
    this.createdAt = Date.now();
    this.status = 'propagating'; // propagating → scattered → absorbed → reflected
  }

  /**
   * Propagate beam through space
   */
  propagate(deltaTime, obstacles = []) {
    if (this.status !== 'propagating') return;

    const effectiveSpeed = this.speed / this.refractiveIndex;
    const distance = effectiveSpeed * deltaTime;

    const lastPos = this.path[this.path.length - 1];
    const newPos = {
      x: lastPos.x + this.direction.x * distance,
      y: lastPos.y + this.direction.y * distance,
      z: lastPos.z + this.direction.z * distance
    };

    // Check for obstacles (gravity wells, opaque entities)
    for (const obstacle of obstacles) {
      const distToObstacle = Math.sqrt(
        Math.pow(newPos.x - obstacle.position.x, 2) +
        Math.pow(newPos.y - obstacle.position.y, 2) +
        Math.pow(newPos.z - obstacle.position.z, 2)
      );

      if (distToObstacle <= obstacle.radius) {
        // Absorption or reflection
        if (Math.random() < TIME_DILATION_CONFIG.LIGHT.absorptionRate) {
          this.status = 'absorbed';
          return null;
        } else {
          this.status = 'reflected';
          // Simple reflection (reverse direction)
          this.direction.x *= -1;
          this.direction.y *= -1;
          this.direction.z *= -1;
          return lastPos;
        }
      }
    }

    // Apply scattering
    if (Math.random() < TIME_DILATION_CONFIG.LIGHT.scatteringCoefficient) {
      this.status = 'scattered';
      // Random direction change
      this.direction.x += (Math.random() - 0.5) * 0.1;
      this.direction.y += (Math.random() - 0.5) * 0.1;
      this.direction.z += (Math.random() - 0.5) * 0.1;
      // Normalize
      const mag = Math.sqrt(
        this.direction.x ** 2 + this.direction.y ** 2 + this.direction.z ** 2
      );
      this.direction.x /= mag;
      this.direction.y /= mag;
      this.direction.z /= mag;
    }

    // Intensity decay over distance
    this.intensity *= Math.exp(-TIME_DILATION_CONFIG.LIGHT.absorptionRate * distance);
    
    if (this.intensity < 0.01) {
      this.status = 'dissipated';
      return null;
    }

    this.path.push(newPos);
    return newPos;
  }

  toJSON() {
    return {
      id: this.id,
      pathLength: this.path.length,
      intensity: this.intensity,
      status: this.status,
      dataPayloadSize: Object.keys(this.data).length
    };
  }
}

// ==================== LIFE FORMS ====================

/**
 * VortexLifeForm - Base class for all life in dilated time
 */
class VortexLifeForm extends EventEmitter {
  constructor(species, coordinate) {
    super();
    this.id = uuidv4();
    this.species = species;
    this.coordinate = coordinate;
    this.birthTime = Date.now();
    this.deathTime = null;
    this.energy = 100;
    this.complexity = 0.5;
    this.stability = 1.0;
    this.generation = 1;
    this.genome = this.generateGenome();
    this.status = 'alive'; // alive → dormant → replicating → dying → dead → evolved
    this.history = [];
    this.offspring = [];
  }

  generateGenome() {
    return {
      timePreference: Math.random(), // 0 = prefers fast, 1 = prefers slow
      gravity_tolerance: Math.random(),
      light_dependency: Math.random(),
      replication_rate: Math.random() * 0.5 + 0.5,
      energy_efficiency: Math.random() * 0.5 + 0.5,
      mutation_rate: Math.random() * 0.1 + 0.01
    };
  }

  /**
   * Experience time passage based on local conditions
   */
  experienceTime(realTimeDelta, gravityWell = 0) {
    const properTime = this.coordinate.calculateProperTime(realTimeDelta, gravityWell);
    this.coordinate.localTime += properTime;
    this.history.push({
      timestamp: Date.now(),
      properTime,
      gravity: gravityWell,
      energy: this.energy
    });

    // Keep history manageable
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    return properTime;
  }

  /**
   * Metabolic process - consume energy to maintain existence
   */
  metabolize(deltaTime) {
    const baseMetabolism = 0.1 * deltaTime;
    const complexityCost = this.complexity * 0.05 * deltaTime;
    const stabilityBonus = this.stability * 0.02 * deltaTime;
    
    const energyConsumed = (baseMetabolism + complexityCost - stabilityBonus) * 
                           (1 - this.genome.energy_efficiency);
    
    this.energy -= energyConsumed;
    
    if (this.energy <= 0) {
      this.status = 'dying';
      return false;
    }
    
    return true;
  }

  /**
   * Check if life form can survive in current conditions
   */
  checkViability(gravity, lightIntensity) {
    const gravityOk = gravity <= this.genome.gravity_tolerance;
    const lightOk = lightIntensity >= (1 - this.genome.light_dependency);
    
    return gravityOk && lightOk && this.stability >= TIME_DILATION_CONFIG.LIFE_THRESHOLDS.minStability;
  }

  /**
   * Reproduce if conditions are met
   */
  reproduce() {
    if (this.energy < 50 || this.status !== 'alive') return null;
    
    if (Math.random() > this.genome.replication_rate) return null;
    
    if (this.complexity < TIME_DILATION_CONFIG.LIFE_THRESHOLDS.minComplexity) return null;

    // Create offspring with mutations
    const childCoordinate = new SpaceTimeCoordinate(
      this.coordinate.x + (Math.random() - 0.5) * 10,
      this.coordinate.y + (Math.random() - 0.5) * 10,
      this.coordinate.z + (Math.random() - 0.5) * 10,
      this.coordinate.timeLayer
    );

    const child = new VortexLifeForm(this.species, childCoordinate);
    child.generation = this.generation + 1;
    child.genome = this.mutateGenome();
    child.energy = this.energy * 0.3; // Transfer 30% energy
    
    this.energy *= 0.7;
    this.offspring.push(child.id);
    this.status = 'replicating';

    setTimeout(() => {
      if (this.status === 'replicating') {
        this.status = 'alive';
      }
    }, 100);

    return child;
  }

  mutateGenome() {
    const mutated = { ...this.genome };
    
    for (const key in mutated) {
      if (Math.random() < this.genome.mutation_rate) {
        const mutation = (Math.random() - 0.5) * 0.2;
        mutated[key] = Math.max(0, Math.min(1, mutated[key] + mutation));
      }
    }
    
    return mutated;
  }

  evolve(newTraits) {
    this.complexity = Math.min(1.0, this.complexity + 0.1);
    this.status = 'evolved';
    setTimeout(() => {
      if (this.status === 'evolved') {
        this.status = 'alive';
      }
    }, 100);
  }

  die() {
    this.deathTime = Date.now();
    this.status = 'dead';
    this.energy = 0;
    this.emit('life:death', this);
  }

  getLifespan() {
    return this.deathTime ? this.deathTime - this.birthTime : Date.now() - this.birthTime;
  }

  toJSON() {
    return {
      id: this.id,
      species: this.species,
      generation: this.generation,
      energy: this.energy,
      complexity: this.complexity,
      stability: this.stability,
      status: this.status,
      genome: this.genome,
      localTime: this.coordinate.localTime,
      timeLayer: this.coordinate.timeLayer,
      lifespan: this.getLifespan(),
      offspring: this.offspring.length
    };
  }
}

// ==================== SPECIALIZED LIFE FORMS ====================

/**
 * QuantumFlicker - Lives only in fast time layer
 * Ultra-fast decision making, dies instantly in slow time
 */
class QuantumFlicker extends VortexLifeForm {
  constructor(coordinate) {
    super('quantum_flicker', coordinate);
    coordinate.timeLayer = 'fast';
    this.decayRate = 0.5; // Dies fast outside preferred layer
    this.flickerFrequency = 1000; // Decisions per real-second
  }

  metabolize(deltaTime) {
    // Super-fast metabolism in fast layer
    const effectiveDelta = deltaTime * TIME_DILATION_CONFIG.FAST_LAYER_MULTIPLIER;
    return super.metabolize(effectiveDelta * 0.001); // But scaled down
  }

  checkViability(gravity, lightIntensity) {
    const baseViability = super.checkViability(gravity, lightIntensity);
    const layerPenalty = this.coordinate.timeLayer !== 'fast' ? 0.5 : 0;
    return baseViability && (this.stability - layerPenalty) > 0.3;
  }
}

/**
 * GravitationalAnchor - Immovable object in slow time layer
 * Experiences extreme time dilation, nearly eternal
 */
class GravitationalAnchor extends VortexLifeForm {
  constructor(coordinate, mass = 1000) {
    super('gravitational_anchor', coordinate);
    coordinate.timeLayer = 'slow';
    this.mass = mass;
    this.createsGravityWell = true;
    this.decayRate = 0.0001; // Extremely slow decay
  }

  metabolize(deltaTime) {
    // Ultra-slow metabolism
    const effectiveDelta = deltaTime * TIME_DILATION_CONFIG.SLOW_LAYER_MULTIPLIER;
    return super.metabolize(effectiveDelta * 1000); // Compensate for slow time
  }

  generateGravityWell() {
    return new GravityWell(
      this.coordinate.x,
      this.coordinate.y,
      this.coordinate.z,
      this.mass
    );
  }
}

/**
 * PhotonSwarm - Light-speed collective consciousness
 * Moves at light speed, exists as information patterns
 */
class PhotonSwarm extends VortexLifeForm {
  constructor(coordinate) {
    super('photon_swarm', coordinate);
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2
    };
    // Normalize to light speed
    const mag = Math.sqrt(this.velocity.x**2 + this.velocity.y**2 + this.velocity.z**2);
    this.velocity.x /= mag;
    this.velocity.y /= mag;
    this.velocity.z /= mag;
    
    this.swarmSize = 1000;
    this.coherence = 1.0;
  }

  move(deltaTime) {
    const speed = TIME_DILATION_CONFIG.LIGHT.baseSpeed * TIME_DILATION_CONFIG.LIGHT.vortexScale;
    const distance = speed * deltaTime;
    
    this.coordinate.x += this.velocity.x * distance;
    this.coordinate.y += this.velocity.y * distance;
    this.coordinate.z += this.velocity.z * distance;
  }

  metabolize(deltaTime) {
    // Photons don't metabolize traditionally, but lose coherence
    this.coherence -= 0.001 * deltaTime;
    if (this.coherence <= 0) {
      this.die();
      return false;
    }
    return true;
  }
}

/**
 * TemporalBridger - Spans both fast and slow layers
 * Can exist in multiple time rates simultaneously
 */
class TemporalBridger extends VortexLifeForm {
  constructor(coordinate) {
    super('temporal_bridger', coordinate);
    this.fastSelf = null;
    this.slowSelf = null;
    this.bridgeStability = 1.0;
    this.synchronization = 0;
  }

  initializeBridge() {
    // Create selves in both layers
    this.fastSelf = new QuantumFlicker(
      new SpaceTimeCoordinate(
        this.coordinate.x,
        this.coordinate.y,
        this.coordinate.z,
        'fast'
      )
    );

    this.slowSelf = new GravitationalAnchor(
      new SpaceTimeCoordinate(
        this.coordinate.x,
        this.coordinate.y,
        this.coordinate.z,
        'slow'
      ),
      100
    );

    this.synchronization = 1.0;
  }

  synchronize(deltaTime) {
    if (!this.fastSelf || !this.slowSelf) return;

    // Attempt to synchronize experiences between layers
    const timeDiff = Math.abs(
      this.fastSelf.coordinate.localTime - this.slowSelf.coordinate.localTime
    );

    this.synchronization = Math.max(0, 1 - timeDiff / 10000);
    this.bridgeStability = this.synchronization * this.stability;

    if (this.synchronization < 0.1) {
      this.bridgeStability = 0;
      this.die();
    }
  }

  metabolize(deltaTime) {
    if (!this.fastSelf || !this.slowSelf) return false;

    const fastAlive = this.fastSelf.metabolize(deltaTime);
    const slowAlive = this.slowSelf.metabolize(deltaTime);

    if (!fastAlive || !slowAlive) {
      this.die();
      return false;
    }

    return super.metabolize(deltaTime);
  }
}

/**
 * DilationPredator - Feeds on time gradient energy
 * Hunts entities at layer boundaries
 */
class DilationPredator extends VortexLifeForm {
  constructor(coordinate) {
    super('dilation_predator', coordinate);
    this.prey = [];
    this.huntEfficiency = 0.7;
    this.gradientSensitivity = 0.9;
  }

  hunt(entities) {
    // Find entities at time layer boundaries
    const boundaryPrey = entities.filter(e => {
      const gradient = Math.abs(
        e.coordinate.localTime - this.coordinate.localTime
      );
      return gradient > 100 && gradient < 1000; // Sweet spot
    });

    if (boundaryPrey.length === 0) return null;

    // Hunt most vulnerable prey
    const target = boundaryPrey.reduce((min, e) => 
      e.energy < min.energy ? e : min
    , boundaryPrey[0]);

    if (Math.random() < this.huntEfficiency) {
      this.consume(target);
      return target;
    }

    return null;
  }

  consume(prey) {
    this.energy += prey.energy * 0.5;
    prey.energy = 0;
    prey.die();
    this.prey.push(prey.id);
  }
}

// ==================== VORTEX ECOSYSTEM ====================

/**
 * TimeDilatedVortex - Complete simulation environment
 */
class TimeDilatedVortex extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...TIME_DILATION_CONFIG, ...config };
    this.entities = new Map();
    this.gravityWells = new Map();
    this.lightBeams = new Map();
    this.coordinates = new Map();
    this.lifeForms = new Map();
    this.simulationStart = null;
    this.currentCycle = 0;
    this.statistics = {
      totalBirths: 0,
      totalDeaths: 0,
      totalReplications: 0,
      avgComplexity: 0,
      layerDistribution: { fast: 0, normal: 0, slow: 0 }
    };
    this.running = false;
    this.simulationLoop = null;
  }

  /**
   * Initialize the vortex with initial conditions
   */
  initialize(initialEntities = 100) {
    console.log('[VORTEX] Initializing time-dilated ecosystem...');
    
    // Create initial gravity wells
    for (let i = 0; i < 5; i++) {
      const well = new GravityWell(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        Math.random() * 500 + 100
      );
      this.gravityWells.set(well.id, well);
    }

    // Create initial light sources
    for (let i = 0; i < 10; i++) {
      const origin = {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      };
      const direction = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      };
      // Normalize
      const mag = Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2);
      direction.x /= mag;
      direction.y /= mag;
      direction.z /= mag;

      const beam = new LightBeam(origin, direction, 1.0, { source: `light-${i}` });
      this.lightBeams.set(beam.id, beam);
    }

    // Seed with diverse life forms
    for (let i = 0; i < initialEntities; i++) {
      this.seedLifeForm();
    }

    console.log(`[VORTEX] Initialized with ${this.entities.size} entities, ${this.gravityWells.size} gravity wells, ${this.lightBeams.size} light beams`);
    this.emit('vortex:initialized', this.getStatistics());
  }

  seedLifeForm() {
    const coord = new SpaceTimeCoordinate(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      ['fast', 'normal', 'slow'][Math.floor(Math.random() * 3)]
    );
    this.coordinates.set(coord.id, coord);

    const speciesRoll = Math.random();
    let lifeForm;

    if (speciesRoll < 0.3) {
      lifeForm = new QuantumFlicker(coord);
    } else if (speciesRoll < 0.5) {
      lifeForm = new GravitationalAnchor(coord, Math.random() * 200 + 50);
    } else if (speciesRoll < 0.7) {
      lifeForm = new PhotonSwarm(coord);
    } else if (speciesRoll < 0.85) {
      lifeForm = new TemporalBridger(coord);
      lifeForm.initializeBridge();
    } else {
      lifeForm = new DilationPredator(coord);
    }

    this.lifeForms.set(lifeForm.id, lifeForm);
    this.entities.set(lifeForm.id, lifeForm);
    this.statistics.totalBirths++;
    
    lifeForm.on('life:death', () => {
      this.statistics.totalDeaths++;
    });

    return lifeForm;
  }

  /**
   * Run one simulation cycle
   */
  simulateCycle(deltaTime) {
    this.currentCycle++;

    // Update gravity wells
    for (const well of this.gravityWells.values()) {
      well.emitHawkingRadiation();
      if (well.stability <= 0) {
        this.gravityWells.delete(well.id);
      }
    }

    // Propagate light beams
    const obstacles = Array.from(this.gravityWells.values());
    for (const beam of this.lightBeams.values()) {
      beam.propagate(deltaTime, obstacles);
      if (beam.status === 'dissipated' || beam.status === 'absorbed') {
        this.lightBeams.delete(beam.id);
      }
    }

    // Replenish light sources periodically
    if (this.currentCycle % 100 === 0 && this.lightBeams.size < 10) {
      const origin = {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      };
      const direction = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2
      };
      const mag = Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2);
      direction.x /= mag;
      direction.y /= mag;
      direction.z /= mag;
      
      const beam = new LightBeam(origin, direction, 1.0, { source: `replenished-${this.currentCycle}` });
      this.lightBeams.set(beam.id, beam);
    }

    // Calculate gravity at each entity's position
    const gravityMap = new Map();
    for (const entity of this.entities.values()) {
      let totalGravity = 0;
      for (const well of this.gravityWells.values()) {
        const dist = Math.sqrt(
          Math.pow(entity.coordinate.x - well.position.x, 2) +
          Math.pow(entity.coordinate.y - well.position.y, 2) +
          Math.pow(entity.coordinate.z - well.position.z, 2)
        );
        totalGravity += well.getGravityAtDistance(dist);
      }
      entity.coordinate.gravityPotential = totalGravity;
      gravityMap.set(entity.id, totalGravity);
    }

    // Calculate light intensity at each position
    const lightMap = new Map();
    for (const entity of this.entities.values()) {
      let totalLight = 0;
      for (const beam of this.lightBeams.values()) {
        // Simplified: check if beam passes near entity
        const lastPos = beam.path[beam.path.length - 1];
        const dist = Math.sqrt(
          Math.pow(entity.coordinate.x - lastPos.x, 2) +
          Math.pow(entity.coordinate.y - lastPos.y, 2) +
          Math.pow(entity.coordinate.z - lastPos.z, 2)
        );
        if (dist < 10) {
          totalLight += beam.intensity;
        }
      }
      entity.coordinate.lightIntensity = Math.min(1.0, totalLight);
      lightMap.set(entity.id, entity.coordinate.lightIntensity);
    }

    // Update life forms
    const deadEntities = [];
    const newborns = [];

    for (const [id, lifeForm] of this.lifeForms.entries()) {
      const gravity = gravityMap.get(id) || 0;
      const light = lightMap.get(id) || 0;

      // Experience time
      lifeForm.experienceTime(deltaTime, gravity);

      // Check viability
      if (!lifeForm.checkViability(gravity, light)) {
        lifeForm.stability -= 0.1;
        if (lifeForm.stability <= 0) {
          deadEntities.push(id);
          continue;
        }
      } else {
        lifeForm.stability = Math.min(1.0, lifeForm.stability + 0.01);
      }

      // Metabolize
      if (!lifeForm.metabolize(deltaTime)) {
        deadEntities.push(id);
        continue;
      }

      // Special behaviors
      if (lifeForm instanceof PhotonSwarm) {
        lifeForm.move(deltaTime);
      } else if (lifeForm instanceof TemporalBridger) {
        lifeForm.synchronize(deltaTime);
      } else if (lifeForm instanceof DilationPredator) {
        const prey = lifeForm.hunt(Array.from(this.lifeForms.values()));
        if (prey) {
          this.statistics.totalReplications++; // Count as energy transfer
        }
      }

      // Reproduction
      const offspring = lifeForm.reproduce();
      if (offspring) {
        this.lifeForms.set(offspring.id, offspring);
        this.entities.set(offspring.id, offspring);
        newborns.push(offspring);
        this.statistics.totalReplications++;
      }

      // Evolution events
      if (lifeForm.complexity > 0.8 && Math.random() < 0.01) {
        lifeForm.evolve({});
        this.emit('life:evolution', lifeForm);
      }
    }

    // Remove dead entities
    for (const id of deadEntities) {
      const entity = this.lifeForms.get(id);
      if (entity && entity.status === 'dead') {
        this.lifeForms.delete(id);
        this.entities.delete(id);
      }
    }

    // Update statistics
    this.updateStatistics(newborns);

    // Emit cycle event
    if (this.currentCycle % 10 === 0) {
      this.emit('vortex:cycle', {
        cycle: this.currentCycle,
        stats: this.getStatistics()
      });
    }

    // Check termination conditions
    if (this.lifeForms.size === 0) {
      this.terminate('extinction');
    } else if (this.currentCycle >= this.config.SIMULATION.maxCycles) {
      this.terminate('max_cycles_reached');
    }
  }

  updateStatistics(newborns) {
    const lifeFormsArray = Array.from(this.lifeForms.values());
    
    this.statistics.avgComplexity = lifeFormsArray.reduce((sum, lf) => sum + lf.complexity, 0) / 
                                    (lifeFormsArray.length || 1);

    this.statistics.layerDistribution = {
      fast: lifeFormsArray.filter(lf => lf.coordinate.timeLayer === 'fast').length,
      normal: lifeFormsArray.filter(lf => lf.coordinate.timeLayer === 'normal').length,
      slow: lifeFormsArray.filter(lf => lf.coordinate.timeLayer === 'slow').length
    };
  }

  /**
   * Start the simulation loop
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.simulationStart = Date.now();
    this.currentCycle = 0;
    
    console.log('[VORTEX] Starting time-dilated simulation...');
    console.log(`[VORTEX] Fast layer: ${this.config.FAST_LAYER_MULTIPLIER}x | Slow layer: ${1/this.config.SLOW_LAYER_MULTIPLIER}x slower`);
    
    const tick = () => {
      if (!this.running) return;
      
      const deltaTime = this.config.tickRateMs / 1000; // Convert to seconds
      this.simulateCycle(deltaTime);
      
      this.simulationLoop = setTimeout(tick, this.config.tickRateMs);
    };
    
    tick();
  }

  /**
   * Stop the simulation
   */
  stop() {
    this.running = false;
    if (this.simulationLoop) {
      clearTimeout(this.simulationLoop);
      this.simulationLoop = null;
    }
    console.log('[VORTEX] Simulation stopped');
  }

  /**
   * Terminate the simulation
   */
  terminate(reason) {
    this.stop();
    console.log(`[VORTEX] Simulation terminated: ${reason}`);
    this.emit('vortex:terminated', { reason, finalStats: this.getStatistics() });
  }

  /**
   * Get current simulation statistics
   */
  getStatistics() {
    const lifeFormsArray = Array.from(this.lifeForms.values());
    
    const speciesCount = {};
    for (const lf of lifeFormsArray) {
      speciesCount[lf.species] = (speciesCount[lf.species] || 0) + 1;
    }

    return {
      cycle: this.currentCycle,
      runtime: Date.now() - this.simulationStart,
      totalEntities: this.entities.size,
      lifeForms: lifeFormsArray.length,
      gravityWells: this.gravityWells.size,
      lightBeams: this.lightBeams.size,
      species: speciesCount,
      births: this.statistics.totalBirths,
      deaths: this.statistics.totalDeaths,
      replications: this.statistics.totalReplications,
      avgComplexity: this.statistics.avgComplexity,
      layerDistribution: this.statistics.layerDistribution,
      running: this.running
    };
  }

  /**
   * Inject new gravity into the system
   */
  injectGravity(x, y, z, mass) {
    const well = new GravityWell(x, y, z, mass);
    this.gravityWells.set(well.id, well);
    console.log(`[VORTEX] Injected gravity well at (${x}, ${y}, ${z}) with mass ${mass}`);
    this.emit('vortex:gravity_injected', well);
    return well;
  }

  /**
   * Inject new light source
   */
  injectLight(x, y, z, dx, dy, dz, intensity = 1.0, data = {}) {
    const origin = { x, y, z };
    const direction = { x: dx, y: dy, z: dz };
    // Normalize
    const mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
    direction.x /= mag;
    direction.y /= mag;
    direction.z /= mag;

    const beam = new LightBeam(origin, direction, intensity, data);
    this.lightBeams.set(beam.id, beam);
    console.log(`[VORTEX] Injected light beam from (${x}, ${y}, ${z})`);
    this.emit('vortex:light_injected', beam);
    return beam;
  }

  /**
   * Seed specific life form
   */
  seedLife(species, x, y, z, timeLayer = 'normal') {
    const coord = new SpaceTimeCoordinate(x, y, z, timeLayer);
    this.coordinates.set(coord.id, coord);

    let lifeForm;
    switch(species) {
      case 'quantum_flicker':
        lifeForm = new QuantumFlicker(coord);
        break;
      case 'gravitational_anchor':
        lifeForm = new GravitationalAnchor(coord, 100);
        break;
      case 'photon_swarm':
        lifeForm = new PhotonSwarm(coord);
        break;
      case 'temporal_bridger':
        lifeForm = new TemporalBridger(coord);
        lifeForm.initializeBridge();
        break;
      case 'dilation_predator':
        lifeForm = new DilationPredator(coord);
        break;
      default:
        lifeForm = new VortexLifeForm(species, coord);
    }

    this.lifeForms.set(lifeForm.id, lifeForm);
    this.entities.set(lifeForm.id, lifeForm);
    this.statistics.totalBirths++;

    console.log(`[VORTEX] Seeded ${species} at (${x}, ${y}, ${z}) in ${timeLayer} time`);
    this.emit('vortex:life_seeded', lifeForm);
    return lifeForm;
  }
}

// Export for use in other modules
export {
  TimeDilatedVortex,
  VortexLifeForm,
  QuantumFlicker,
  GravitationalAnchor,
  PhotonSwarm,
  TemporalBridger,
  DilationPredator,
  GravityWell,
  LightBeam,
  SpaceTimeCoordinate,
  TIME_DILATION_CONFIG
};
