/**
 * Live Ledger Demo Script
 * 
 * Demonstrates the Sovereign Care Protocol in action:
 * 1. Register surplus sources (grid, compute, yield)
 * 2. Add verified medical bills
 * 3. Report surplus and watch autonomous allocation
 * 4. Observe healing transactions broadcast to public ledger
 */

import { LiveLedgerSystem } from './services/LiveLedger.js';

// Initialize the Live Ledger System
console.log('🏛️  SOVEREIGN CARE PROTOCOL - LIVE LEDGER DEMO\n');

const liveLedger = new LiveLedgerSystem({
  HEALING_LATENCY_MS: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_THRESHOLD_MS: 10 * 1000, // 10 seconds (shortened for demo)
  BROADCAST_INTERVAL: 2000 // 2 seconds (shortened for demo)
});

// Activate hive agents
liveLedger.activateHiveAgents(5);

// Wait for initialization
setTimeout(() => {
  runDemo();
}, 1000);

async function runDemo() {
  console.log('\n📋 STEP 1: Register Surplus Sources');
  console.log('=' .repeat(50));
  
  // Register different surplus sources
  liveLedger.registerSurplusSource('grid-node-1', 'grid_stabilization', { location: 'Texas', capacity: '500MW' });
  liveLedger.registerSurplusSource('compute-cluster-a', 'compute_efficiency', { nodes: 1000, type: 'GPU' });
  liveLedger.registerSurplusSource('yield-pool-alpha', 'syntropic_yield', { strategy: 'defi_arb', risk: 'low' });
  
  console.log('\n✅ Registered 3 surplus sources');
  
  // Wait a moment
  await sleep(1000);
  
  console.log('\n\n📋 STEP 2: Add Verified Medical Bills');
  console.log('=' .repeat(50));
  
  // Add medical bills (simulating verified patient needs)
  const bills = [
    liveLedger.addMedicalBill(
      'patient_hash_a1b2c3',
      'Memorial Hospital',
      5000,
      '0xabc123_verification_hash'
    ),
    liveLedger.addMedicalBill(
      'patient_hash_d4e5f6',
      'City Clinic',
      2500,
      '0xdef456_verification_hash'
    ),
    liveLedger.addMedicalBill(
      'patient_hash_g7h8i9',
      'Regional Medical Center',
      8000,
      '0xghi789_verification_hash'
    ),
    liveLedger.addMedicalBill(
      'patient_hash_j0k1l2',
      'Community Health',
      1500,
      '0xjkl012_verification_hash'
    ),
    liveLedger.addMedicalBill(
      'patient_hash_m3n4o5',
      'University Hospital',
      12000,
      '0xmno345_verification_hash'
    )
  ];
  
  console.log(`\n✅ Added ${bills.length} medical bills totaling $${bills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}`);
  
  // Wait a moment
  await sleep(1000);
  
  console.log('\n\n📋 STEP 3: Report Surplus & Watch Autonomous Allocation');
  console.log('=' .repeat(50));
  
  // Report surplus from different sources
  console.log('\n💰 Reporting surplus from grid stabilization...');
  liveLedger.reportSurplus('grid-node-1', 7500, { timestamp: Date.now(), efficiency: 0.95 });
  
  await sleep(2000);
  
  console.log('\n💰 Reporting surplus from compute efficiency...');
  liveLedger.reportSurplus('compute-cluster-a', 3000, { timestamp: Date.now(), savings: '20%' });
  
  await sleep(2000);
  
  console.log('\n💰 Reporting surplus from syntropic yield...');
  liveLedger.reportSurplus('yield-pool-alpha', 15000, { timestamp: Date.now(), apy: 0.08 });
  
  await sleep(2000);
  
  console.log('\n\n📋 STEP 4: Check System Status');
  console.log('=' .repeat(50));
  
  const status = liveLedger.getStatus();
  
  console.log('\n📊 SURPLUS STATISTICS:');
  console.log(`   Total Detected: $${status.surplus.totalDetected.toLocaleString()}`);
  console.log(`   Available: $${status.surplus.available.toLocaleString()}`);
  console.log(`   Active Sources: ${status.surplus.sourceCount}`);
  
  console.log('\n💚 ALLOCATION STATISTICS:');
  console.log(`   Total Allocated: $${status.allocator.totalAllocated.toLocaleString()}`);
  console.log(`   Bills Paid: ${status.allocator.billsPaid}`);
  console.log(`   Patients Helped: ${status.allocator.patientsHelped}`);
  console.log(`   Pending Amount: $${status.allocator.pendingAmount.toLocaleString()}`);
  
  console.log('\n📡 ROUTER STATISTICS:');
  console.log(`   Pending Transactions: ${status.router.pendingTransactions}`);
  console.log(`   Completed Transactions: ${status.router.completedTransactions}`);
  
  await sleep(2000);
  
  console.log('\n\n📋 STEP 5: View Public Dashboard');
  console.log('=' .repeat(50));
  
  const dashboard = liveLedger.getPublicDashboard(10);
  
  console.log('\n🌍 PUBLIC DASHBOARD:');
  console.log(`   Total Healing: $${dashboard.stats.totalHealing.toLocaleString()}`);
  console.log(`   Patients Helped: ${dashboard.stats.totalPatientsHelped}`);
  console.log(`   Bills Paid: ${dashboard.stats.totalBillsPaid}`);
  
  if (dashboard.recentTransactions.length > 0) {
    console.log(`\n   RECENT TRANSACTIONS (${dashboard.recentTransactions.length}):`);
    dashboard.recentTransactions.slice(-5).forEach(tx => {
      console.log(`   - ${tx.hash.substring(0, 16)}... | $${tx.amount.toLocaleString()} | ${tx.status}`);
    });
  }
  
  await sleep(2000);
  
  console.log('\n\n📋 STEP 6: Simulate More Surplus (Watch Bills Get Paid)');
  console.log('=' .repeat(50));
  
  // Add more surplus to pay off remaining bills
  console.log('\n💰 Large surplus detected from grid optimization...');
  liveLedger.reportSurplus('grid-node-1', 25000, { timestamp: Date.now(), event: 'grid_optimization' });
  
  await sleep(3000);
  
  console.log('\n\n📋 FINAL STATUS');
  console.log('=' .repeat(50));
  
  const finalStatus = liveLedger.getStatus();
  
  console.log('\n🎯 FINAL STATISTICS:');
  console.log(`   Total Surplus Detected: $${finalStatus.surplus.totalDetected.toLocaleString()}`);
  console.log(`   Total Allocated: $${finalStatus.allocator.totalAllocated.toLocaleString()}`);
  console.log(`   Bills Paid: ${finalStatus.allocator.billsPaid} / ${bills.length}`);
  console.log(`   Patients Helped: ${finalStatus.allocator.patientsHelped}`);
  console.log(`   Remaining Bills: ${finalStatus.allocator.billsInQueue}`);
  console.log(`   Pending Amount: $${finalStatus.allocator.pendingAmount.toLocaleString()}`);
  
  const finalDashboard = liveLedger.getPublicDashboard(100);
  console.log(`\n🌍 TOTAL HEALING ON LEDGER: $${finalDashboard.stats.totalHealing.toLocaleString()}`);
  console.log(`   Transactions Broadcast: ${finalDashboard.recentTransactions.length}`);
  
  console.log('\n\n✅ DEMO COMPLETE');
  console.log('=' .repeat(50));
  console.log('\nThe Sovereign Care Protocol has successfully:');
  console.log('   ✓ Detected surplus from multiple sources');
  console.log('   ✓ Autonomously allocated surplus to medical bills');
  console.log('   ✓ Broadcast healing transactions to public ledger');
  console.log('   ✓ Provided real-time verification via dashboard');
  console.log('   ✓ Enforced accountability (idle surplus monitoring active)');
  console.log('\n🔗 This is operational sovereignty in action.\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runDemo().catch(console.error);
