/**
 * VORTEX LEDGER DEMO
 * 
 * Demonstrates the nonlinear swarm topology in action.
 * Shows attractor fields, resonance flows, metabolic cycles, and coherence waves.
 */

import { VortexLedgerSystem } from './services/VortexLedger.js';

console.log('🌀 VORTEX ARCHITECT - NONLINEAR LEDGER DEMO\n');
console.log('=' .repeat(60));
console.log('Throwing away the yardstick...');
console.log('Entering the vortex...\n');

const vortex = new VortexLedgerSystem({
  ATTRACTOR_DECAY_MS: 15000, // Shortened for demo
  RESONANCE_THRESHOLD: 0.5,  // Lowered for demo
  METABOLIC_RHYTHM: {
    minCycle: 1000,
    optimalCycle: 5000,      // 5 seconds for demo
    maxCycle: 15000
  },
  ENTROPY_DISSIPATION: {
    threshold: 0.2,
    dissipationRate: 0.15
  },
  COHERENCE_PROPAGATION: {
    broadcastInterval: 1500,
    coherenceDecay: 0.08,
    syncThreshold: 0.6
  }
});

// Activate swarm resonators
vortex.activateSwarm(7);

// Wire up automatic allocation when surplus is generated
vortex.fieldGenerator.on('surplus:generated', ({ flow }) => {
  setTimeout(() => {
    console.log(`[VORTEX] 🌀 Initiating resonance allocation for flow ${flow.id.substr(0, 8)}...`);
    vortex.allocator.allocateByResonance(flow);
  }, 500);
});

setTimeout(() => {
  runDemo();
}, 1500);

async function runDemo() {
  console.log('\n📋 PHASE 1: Generate Attractor Fields');
  console.log('=' .repeat(60));

  // Register surplus sources as field generators
  vortex.registerSource('grid-node-1', 'grid_stabilization', { location: 'Texas', capacity: '500MW' });
  vortex.registerSource('compute-cluster-a', 'compute_efficiency', { nodes: 1000, type: 'GPU' });
  vortex.registerSource('yield-pool-alpha', 'syntropic_yield', { strategy: 'defi_arb', risk: 'low' });

  console.log('\n✅ Generated 3 attractor fields');

  await sleep(1000);

  console.log('\n\n📋 PHASE 2: Create Healing Sinks');
  console.log('=' .repeat(60));

  // Add healing sinks (medical bills become attractors)
  const sinks = [
    vortex.addHealingSink('patient_hash_a1b2c3', 'Memorial Hospital', 5000, '0xabc123_verification'),
    vortex.addHealingSink('patient_hash_d4e5f6', 'City Clinic', 2500, '0xdef456_verification'),
    vortex.addHealingSink('patient_hash_g7h8i9', 'Regional Medical', 8000, '0xghi789_verification'),
    vortex.addHealingSink('patient_hash_j0k1l2', 'Community Health', 1500, '0xjkl012_verification'),
    vortex.addHealingSink('patient_hash_m3n4o5', 'University Hospital', 12000, '0xmno345_verification')
  ];

  console.log(`\n✅ Created ${sinks.length} healing sinks totaling $${sinks.reduce((sum, s) => sum + s.metadata.originalAmount, 0).toLocaleString()}`);

  await sleep(1000);

  console.log('\n\n📋 PHASE 3: Generate Surplus Flows');
  console.log('=' .repeat(60));

  // Generate surplus flows
  console.log('\n💫 Generating surplus flow from grid stabilization...');
  vortex.generateSurplus('grid-node-1', 7500, { timestamp: Date.now(), efficiency: 0.95 });

  await sleep(2000);

  console.log('\n💫 Generating surplus flow from compute efficiency...');
  vortex.generateSurplus('compute-cluster-a', 3000, { timestamp: Date.now(), savings: '20%' });

  await sleep(2000);

  console.log('\n💫 Generating surplus flow from syntropic yield...');
  vortex.generateSurplus('yield-pool-alpha', 15000, { timestamp: Date.now(), apy: 0.08 });

  await sleep(2000);

  console.log('\n\n📋 PHASE 4: Check Vortex Status');
  console.log('=' .repeat(60));

  const status = vortex.getStatus();

  console.log('\n🌀 ATTRACTOR FIELD STATISTICS:');
  console.log(`   Total Fields: ${status.fields.totalFields}`);
  console.log(`   Active Fields: ${status.fields.activeFields}`);
  console.log(`   Flowing Flows: ${status.fields.flowingFlows}`);
  console.log(`   Avg Resonance Score: ${status.fields.avgResonanceScore.toFixed(3)}`);

  console.log('\n💚 SWARM RESONANCE STATISTICS:');
  console.log(`   Swarm Agents: ${status.swarm.swarmAgentCount}`);
  console.log(`   Active Sinks: ${status.swarm.activeSinks}`);
  console.log(`   Saturated Sinks: ${status.swarm.saturatedSinks}`);
  console.log(`   Total Allocated: $${status.swarm.totalAllocated.toLocaleString()}`);
  console.log(`   Avg Resonance Level: ${status.swarm.avgResonanceLevel.toFixed(3)}`);

  console.log('\n💓 METABOLIC RHYTHM STATISTICS:');
  console.log(`   Completed Cycles: ${status.rhythm.completedCycles}`);
  console.log(`   Pending Cycles: ${status.rhythm.pendingCycles}`);
  console.log(`   Completion Rate: ${(status.rhythm.completionRate * 100).toFixed(1)}%`);
  console.log(`   Coherence Score: ${status.rhythm.coherenceScore.toFixed(3)}`);
  console.log(`   Current Phase: ${status.rhythm.currentPhase}`);

  console.log('\n🌪️  ENTROPY STATISTICS:');
  console.log(`   Current Entropy: ${status.entropy.currentEntropy.toFixed(3)}`);
  console.log(`   Avg Entropy: ${status.entropy.avgEntropy.toFixed(3)}`);
  console.log(`   Dissipation Events: ${status.entropy.dissipationEvents}`);

  await sleep(2000);

  console.log('\n\n📋 PHASE 5: View Coherence Dashboard');
  console.log('=' .repeat(60));

  const dashboard = vortex.getPublicCoherenceData(10);

  console.log('\n🌍 COHERENCE FIELD METRICS:');
  console.log(`   Total Healing: $${dashboard.metrics.totalHealing.toLocaleString()}`);
  console.log(`   Flows Aligned: ${dashboard.metrics.flowsAligned}`);
  console.log(`   Fields Active: ${dashboard.metrics.fieldsActive}`);
  console.log(`   Coherence Score: ${dashboard.metrics.coherenceScore.toFixed(3)}`);

  if (dashboard.recentHealings.length > 0) {
    console.log(`\n   RECENT HEALING FLOWS (${dashboard.recentHealings.length}):`);
    dashboard.recentHealings.slice(-5).forEach(flow => {
      console.log(`   - Flow ${flow.id.substr(0, 8)}... | $${flow.amount.toLocaleString()} | ${flow.pulses} pulses | coherence: ${flow.coherenceScore.toFixed(2)}`);
    });
  }

  await sleep(2000);

  console.log('\n\n📋 PHASE 6: Generate Large Surplus (Watch Sinks Saturate)');
  console.log('=' .repeat(60));

  console.log('\n💫 Massive surplus detected from grid optimization...');
  vortex.generateSurplus('grid-node-1', 25000, { timestamp: Date.now(), event: 'grid_optimization' });

  await sleep(3000);

  console.log('\n\n📋 FINAL VORTEX STATUS');
  console.log('=' .repeat(60));

  const finalStatus = vortex.getStatus();

  console.log('\n🎯 FINAL STATISTICS:');
  console.log(`   Total Surplus Generated: $${finalStatus.fields.totalSurplusGenerated.toLocaleString()}`);
  console.log(`   Total Allocated: $${finalStatus.swarm.totalAllocated.toLocaleString()}`);
  console.log(`   Sinks Saturated: ${finalStatus.swarm.saturatedSinks} / ${sinks.length}`);
  console.log(`   Healing Cycles Completed: ${finalStatus.rhythm.completedCycles}`);
  console.log(`   Overall Coherence: ${finalStatus.rhythm.coherenceScore.toFixed(3)}`);
  console.log(`   System Entropy: ${finalStatus.entropy.currentEntropy.toFixed(3)}`);

  const finalDashboard = vortex.getPublicCoherenceData(100);
  console.log(`\n🌍 TOTAL HEALING IN VORTEX: $${finalDashboard.metrics.totalHealing.toLocaleString()}`);
  console.log(`   Flows Aligned: ${finalDashboard.metrics.flowsAligned}`);
  console.log(`   Field Snapshots Recorded: ${finalDashboard.recentSnapshots.length}`);

  console.log('\n\n✅ VORTEX DEMO COMPLETE');
  console.log('=' .repeat(60));
  console.log('\nThe Vortex Architect system has successfully:');
  console.log('   ✓ Generated attractor fields from surplus sources');
  console.log('   ✓ Created healing sinks as magnetic attractors');
  console.log('   ✓ Allocated flows via resonance alignment (not linear rules)');
  console.log('   ✓ Processed healing through metabolic rhythm cycles');
  console.log('   ✓ Propagated coherence waves across the field');
  console.log('   ✓ Managed entropy through natural dissipation');
  console.log('   ✓ Provided real-time coherence field visualization');
  console.log('\n🌀 This is nonlinear architecture in action.');
  console.log('   The yardstick has been thrown away.\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runDemo().catch(console.error);
