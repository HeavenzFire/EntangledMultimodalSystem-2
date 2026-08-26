/**
 * Legion Protocol
 * 
 * Command structure for controlling swarms via high-radix encoded tokens.
 * A single "Legion Packet" can address thousands of agents with minimal overhead.
 */

const { RadixEncoder } = require('../sdk/radix-encoder');

const CMD_CODES = {
  SPAWN: 0x01,
  KILL: 0x02,
  MIGRATE: 0x03,
  SYNC: 0x04,
  BROADCAST: 0x05,
  CONVERGE: 0x06,
  DIVERGE: 0x07,
  REPORT: 0x08
};

class LegionPacket {
  constructor() {
    this.encoder = new RadixEncoder(94);
  }

  /**
   * Create a compact command packet
   * @param {number} cmdCode - Command opcode
   * @param {Array} targets - Array of agent IDs or group masks
   * @param {Object} payload - Optional data payload
   * @returns {string} Encoded packet string
   */
  create(cmdCode, targets = [], payload = {}) {
    const header = Buffer.from([
      0xAB, // Magic byte start
      cmdCode,
      targets.length & 0xFF,
      (targets.length >> 8) & 0xFF
    ]);

    // Encode target IDs as a bitmask or list depending on density
    let targetBuffer;
    if (targets.length > 16) {
      // Use bloom filter / bitmask for large groups
      targetBuffer = this.createBitmask(targets);
    } else {
      // Direct ID list
      targetBuffer = Buffer.from(targets.join(','), 'utf8');
    }

    const payloadBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
    
    // Assemble full binary packet
    const fullPacket = Buffer.concat([
      header,
      targetBuffer,
      Buffer.from([0xCD]), // Separator
      payloadBuffer
    ]);

    // Compress via Base94
    return this.encoder.encode(fullPacket);
  }

  /**
   * Decode a received packet
   * @param {string} encoded - The encoded packet string
   * @returns {Object} Decoded command structure
   */
  decode(encoded) {
    try {
      const buffer = this.encoder.decode(encoded);
      
      if (buffer[0] !== 0xAB) {
        throw new Error('Invalid magic byte');
      }

      const cmdCode = buffer[1];
      const targetLen = buffer[2] | (buffer[3] << 8);
      
      let targets = [];
      let offset = 4;
      
      // Simple parsing logic (enhance for bitmasks)
      let separatorIndex = buffer.indexOf(0xCD, offset);
      if (separatorIndex === -1) separatorIndex = buffer.length;
      
      const targetStr = buffer.slice(offset, separatorIndex).toString('utf8');
      if (targetLen > 16 && targetStr.length < 10) {
        // Bitmask mode - expand later
        targets = ['*']; 
      } else {
        targets = targetStr.split(',').filter(Boolean);
      }

      const payloadBuf = buffer.slice(separatorIndex + 1);
      const payload = JSON.parse(payloadBuf.toString('utf8') || '{}');

      return {
        cmd: this.getCmdName(cmdCode),
        code: cmdCode,
        targets,
        payload,
        raw: encoded
      };
    } catch (e) {
      console.error('Packet decode failed:', e.message);
      return null;
    }
  }

  createBitmask(ids) {
    // Simplified bitmask creation
    // In production, map IDs to integer ranges and set bits
    const mask = Buffer.alloc(Math.ceil(ids.length / 8));
    ids.forEach(id => {
      // Hash id to index
      const hash = this.simpleHash(id);
      const byteIdx = Math.floor(hash % (mask.length * 8)) / 8;
      const bitIdx = hash % 8;
      mask[byteIdx] |= (1 << bitIdx);
    });
    return mask;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getCmdName(code) {
    return Object.keys(CMD_CODES).find(key => CMD_CODES[key] === code) || 'UNKNOWN';
  }
}

// Pre-built command helpers
class LegionCommands {
  constructor() {
    this.packet = new LegionPacket();
  }

  spawn(agentType, count, config) {
    return this.packet.create(CMD_CODES.SPAWN, [agentType], { count, config });
  }

  kill(targets) {
    return this.packet.create(CMD_CODES.KILL, targets);
  }

  migrate(fromNode, toNode, agents) {
    return this.packet.create(CMD_CODES.MIGRATE, agents, { fromNode, toNode });
  }

  sync(checkpointId) {
    return this.packet.create(CMD_CODES.SYNC, ['*'], { checkpointId });
  }

  broadcast(message) {
    return this.packet.create(CMD_CODES.BROADCAST, ['*'], { message });
  }

  converge(goalState) {
    return this.packet.create(CMD_CODES.CONVERGE, ['*'], { goalState });
  }

  diverge() {
    return this.packet.create(CMD_CODES.DIVERGE, ['*']);
  }

  report(metrics) {
    return this.packet.create(CMD_CODES.REPORT, ['coordinator'], metrics);
  }
}

module.exports = { LegionPacket, LegionCommands, CMD_CODES };
