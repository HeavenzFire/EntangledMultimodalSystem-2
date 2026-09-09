/**
 * TIME-DILATED VORTEX DEMO
 * 
 * Demonstrates life formation under extreme time dilation conditions.
 * 
 * Run with: node demo-time-dilated-vortex.js
 */

import { 
  TimeDilatedVortex, 
  QuantumFlicker, 
  GravitationalAnchor, 
  PhotonSwarm, 
  TemporalBridger, 
  DilationPredator,
  TIME_DILATION_CONFIG 
} from './services/TimeDilatedVortex.js';

console.log('🌀═══════════════════════════════════════════════════════════');
console.log('   TIME-DILATED VORTEX SIMULATION');
console.log('   A Vortex Architect\'s Playground');
console.log('═══════════════════════════════════════════════════════════\n');

// Create the vortex simulation
const vortex = new TimeDilatedVortex({
  FAST_LAYER_MULTIPLIER: 1000,    // 1000x faster
  SLOW_LAYER_MULTIPLIER: 0.002,   // 500x slower
  SIMULATION: {
    maxCycles: 500,               // Run for 500 cycles
    tickRateMs: 50                // Slower ticks for visibility
  }
});

// Track interesting events
let evolutionCount = 0;
let extinctionEvents = 0;
let predatorSuccess = 0;

vortex.on('vortex:initialized', (stats) => {
  console.log('✅ Vortex Initialized');
  console.log(`   • Initial entities: ${stats.lifeForms}`);
  console.log(`   • Gravity wells: ${stats.gravityWells}`);
  console.log(`   • Light beams: ${stats.lightBeams}`);
  console.log(`   • Fast layer multiplier: 1000x`);
  console.log(`   • Slow layer multiplier: 500x slower\n`);
});

vortex.on('life:evolution', (lifeForm) => {
  evolutionCount++;
  console.log(`🧬 EVOLUTION EVENT #${evolutionCount}`);
  console.log(`   Species: ${lifeForm.species}`);
  console.log(`   Generation: ${lifeForm.generation}`);
  console.log(`   Complexity: ${lifeForm.complexity.toFixed(3)}`);
  console.log(`   Time layer: ${lifeForm.coordinate.timeLayer}`);
  console.log(`   Local time experienced: ${lifeForm.coordinate.localTime.toFixed(2)}\n`);
});

vortex.on('vortex:gravity_injected', (well) => {
  console.log(`🕳️  NEW GRAVITY WELL CREATED`);
  console.log(`   Position: (${well.position.x.toFixed(1)}, ${well.position.y.toFixed(1)}, ${well.position.z.toFixed(1)})`);
  console.log(`   Mass: ${well.mass.toFixed(1)}`);
  console.log(`   Event horizon radius: ${well.eventHorizon.toFixed(3)}\n`);
});

vortex.on('vortex:light_injected', (beam) => {
  console.log(`💡 LIGHT BEAM INJECTED`);
  console.log(`   Origin: (${beam.origin.x.toFixed(1)}, ${beam.origin.y.toFixed(1)}, ${beam.origin.z.toFixed(1)})`);
  console.log(`   Direction: (${beam.direction.x.toFixed(2)}, ${beam.direction.y.toFixed(2)}, ${beam.direction.z.toFixed(2)})`);
  console.log(`   Data payload: ${JSON.stringify(beam.data)}\n`);
});

vortex.on('vortex:cycle', (data) => {
  const { cycle, stats } = data;
  
  // Print statistics every 50 cycles
  if (cycle % 10 === 0) {
    console.log(`📊 CYCLE ${cycle} STATISTICS`);
    console.log(`   Living entities: ${stats.lifeForms}`);
    console.log(`   Total births: ${stats.births}`);
    console.log(`   Total deaths: ${stats.deaths}`);
    console.log(`   Replications: ${stats.replications}`);
    console.log(`   Average complexity: ${stats.avgComplexity.toFixed(3)}`);
    console.log(`   Layer distribution:`);
    console.log(`     • Fast layer: ${stats.layerDistribution.fast}`);
    console.log(`     • Normal layer: ${stats.layerDistribution.normal}`);
    console.log(`     • Slow layer: ${stats.layerDistribution.slow}`);
    console.log(`   Species breakdown:`);
    for (const [species, count] of Object.entries(stats.species)) {
      console.log(`     • ${species}: ${count}`);
    }
    console.log('');
  }
});

vortex.on('vortex:terminated', (data) => {
  const { reason, finalStats } = data;
  
  console.log(`🏁 SIMULATION TERMINATED`);
  console.log(`   Reason: ${reason}`);
  console.log(`   Total runtime: ${(finalStats.runtime / 1000).toFixed(2)} seconds`);
  console.log(`   Final cycle: ${finalStats.cycle}`);
  console.log(`\n📈 FINAL STATISTICS`);
  console.log(`   Total births: ${finalStats.births}`);
  console.log(`   Total deaths: ${finalStats.deaths}`);
  console.log(`   Net population change: ${finalStats.births - finalStats.deaths}`);
  console.log(`   Total replications: ${finalStats.replications}`);
  console.log(`   Evolution events: ${evolutionCount}`);
  console.log(`   Final average complexity: ${finalStats.avgComplexity.toFixed(3)}`);
  
  if (Object.keys(finalStats.species).length > 0) {
    console.log(`\n🧬 SURVIVING SPECIES:`);
    for (const [species, count] of Object.entries(finalStats.species)) {
      console.log(`   • ${species}: ${count} individuals`);
    }
  } else {
    console.log(`\n💀 EXTINCTION - No species survived`);
  }
  
  console.log(`\n⏰ TIME DILATION INSIGHTS:`);
  console.log(`   Fast layer entities experienced time ${1000}x faster than real time`);
  console.log(`   Slow layer entities experienced time ${1/0.002}x slower than real time`);
  console.log(`   This means:`);
  console.log(`     • 1 second real time = 1000 seconds (~16.7 minutes) for fast layer`);
  console.log(`     • 1 second real time = 0.002 seconds for slow layer`);
  console.log(`     • Fast layer evolves 500,000x faster than slow layer!`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
});

// Initialize the vortex with 150 entities
console.log('Initializing vortex ecosystem...\n');
vortex.initialize(150);

// Wait a moment then start simulation
setTimeout(() => {
  console.log('Starting simulation...\n');
  vortex.start();
}, 1000);

// Inject some additional gravity after 5 seconds to perturb the system
setTimeout(() => {
  console.log('\n⚡ PERTURBATION: Injecting massive gravity well...\n');
  vortex.injectGravity(0, 0, 0, 2000);
}, 5000);

// Inject light after 7 seconds
setTimeout(() => {
  console.log('\n⚡ PERTURBATION: Injecting high-intensity light beam...\n');
  vortex.injectLight(-50, -50, -50, 1, 1, 1, 2.0, { message: 'External energy injection' });
}, 7000);

// Seed a temporal bridger after 10 seconds
setTimeout(() => {
  console.log('\n⚡ EXPERIMENT: Seeding rare Temporal Bridger entity...\n');
  vortex.seedLife('temporal_bridger', 25, 25, 25, 'normal');
}, 10000);

// Stop after 15 seconds or when terminated naturally
setTimeout(() => {
  if (vortex.running) {
    console.log('\n⏹️  Manual stop requested by observer...\n');
    vortex.stop();
  }
}, 15000);
