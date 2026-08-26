/**
 * Swarm Launch Demo
 * 
 * Demonstrates launching agentic swarms using high-radix commands.
 * Shows how few processes can command legions of agents.
 */

const { SwarmOrchestrator } = require('./orchestrator/swarm-manager');
const { LegionCommands } = require('./protocol/legion-protocol');
const { RadixEncoder } = require('./sdk/radix-encoder');

async function demo() {
  console.log('=== NEURAL MESH SWARM LAUNCH ===\n');

  // Initialize orchestrator
  const orchestrator = new SwarmOrchestrator('http://localhost:3000');
  
  // Listen for broadcast events (would go to message bus in prod)
  orchestrator.on('broadcast', (packets) => {
    console.log(`\n[BUS] Broadcasting ${packets.length} encoded command packets:`);
    packets.forEach((p, i) => {
      console.log(`  Packet ${i+1}: ${p.substring(0, 60)}${p.length > 60 ? '...' : ''} (${p.length} chars)`);
    });
  });

  orchestrator.on('swarm:ready', (id) => {
    console.log(`[EVENT] Swarm ${id} is ready\n`);
  });

  // Demo 1: Spawn a coding swarm
  console.log('1. Spawning "lattice-builder" swarm...');
  const swarm1 = await orchestrator.spawnSwarm(
    'lattice-builder',
    'Build a self-replicating code lattice with automated testing',
    { coder: 10, tester: 5, optimizer: 3 }
  );
  console.log(`   Created swarm with ${swarm1.agents.length} agents\n`);

  // Demo 2: Show radix encoding efficiency
  console.log('2. Demonstrating high-radix compression...');
  const commands = new LegionCommands();
  
  // Create a broadcast to 1000 agents
  const testTargets = Array.from({ length: 1000 }, (_, i) => `agent-${i}`);
  const packet = commands.broadcast('CONVERGE_TO_OPTIMAL_STATE');
  
  const jsonSize = Buffer.byteLength(JSON.stringify({ targets: testTargets, cmd: 'broadcast' }), 'utf8');
  const encodedSize = packet.length;
  const ratio = ((1 - encodedSize / jsonSize) * 100).toFixed(2);
  
  console.log(`   JSON representation: ${jsonSize} bytes`);
  console.log(`   Base94 Legion packet: ${encodedSize} bytes`);
  console.log(`   Compression: ${ratio}% reduction\n`);

  // Demo 3: Decode and verify
  console.log('3. Verifying packet decoding...');
  const { LegionPacket } = require('./protocol/legion-protocol');
  const decoder = new LegionPacket();
  const decoded = decoder.decode(packet);
  console.log(`   Decoded command: ${decoded.cmd}`);
  console.log(`   Targets: ${decoded.targets.length} agents (wildcard)\n`);

  // Demo 4: Converge swarm
  console.log('4. Converging swarm to new objective...');
  orchestrator.convergeSwarm('lattice-builder', 'Optimize for minimal latency');
  
  // Demo 5: Show encoder flexibility
  console.log('\n5. Testing different radix bases...');
  const testData = Buffer.from('SWARM_COMMAND_LEGION_ALPHA_7', 'utf8');
  
  const base64 = new RadixEncoder(64);
  const base85 = new RadixEncoder(85);
  const base94 = new RadixEncoder(94);
  
  const enc64 = base64.encode(testData);
  const enc85 = base85.encode(testData);
  const enc94 = base94.encode(testData);
  
  console.log(`   Original: ${testData.length} bytes`);
  console.log(`   Base64: ${enc64.length} chars`);
  console.log(`   Base85: ${enc85.length} chars`);
  console.log(`   Base94: ${enc94.length} chars (most dense)\n`);

  // Demo 6: Status check
  console.log('6. Swarm status:');
  const status = orchestrator.getStatus();
  status.forEach(s => {
    console.log(`   - ${s.id}: ${s.state} (${s.agents.length} agents)`);
  });

  console.log('\n=== DEMO COMPLETE ===');
  console.log('Swarm infrastructure ready for 256-repo mesh deployment.');
}

demo().catch(console.error);
