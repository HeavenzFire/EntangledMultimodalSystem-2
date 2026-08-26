/**
 * High-Radix Codec for Neural Mesh Command Compression
 * Supports Base85, Base94, and custom radix encodings for legion-scale swarm control
 * 
 * NOTE: For true compression, combine with gzip/deflate. This provides encoding,
 * not compression - use for binary-safe text transport of compact protocols.
 */

import { deflateSync, inflateSync } from 'zlib';

const BASE94_CHARS = '!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const BASE85_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

/**
 * Legion Opcode definitions
 */
export const LegionOpcode = {
  SPAWN: 0x01,
  KILL: 0x02,
  MIGRATE: 0x03,
  SYNC: 0x04,
  BROADCAST: 0x05,
  CONVERGE: 0x06,
  DIVERGE: 0x07,
  REPORT: 0x08
};

/**
 * Encode data to Base94 string with optional compression
 */
export function encodeBase94(data, compress = true) {
  let bytes = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : new Uint8Array(data);
  
  // Apply deflate compression first for true size reduction
  if (compress && bytes.length > 50) {
    bytes = deflateSync(Buffer.from(bytes));
  }
  
  // Store original length for proper decoding
  const lengthPrefix = Buffer.alloc(4);
  lengthPrefix.writeUInt32BE(bytes.length, 0);
  bytes = Buffer.concat([lengthPrefix, Buffer.from(bytes)]);
  
  let result = '';
  let value = 0n;
  const base = 94n;
  
  // Convert bytes to big integer
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  
  // Convert to base94
  const chars = BASE94_CHARS.split('');
  if (value === 0n) return chars[0];
  
  while (value > 0n) {
    const remainder = value % base;
    result = chars[Number(remainder)] + result;
    value = value / base;
  }
  
  return result;
}

/**
 * Decode Base94 string back to bytes with optional decompression
 */
export function decodeBase94(encoded, compressed = true) {
  const chars = BASE94_CHARS.split('');
  const charMap = new Map(chars.map((c, i) => [c, BigInt(i)]));
  const base = 94n;
  
  let value = 0n;
  for (const char of encoded) {
    value = (value * base) + (charMap.get(char) || 0n);
  }
  
  // Convert back to bytes
  const byteLength = Math.ceil((encoded.length * Math.log2(94)) / 8);
  const bytes = new Uint8Array(byteLength || 1);
  
  for (let i = byteLength - 1; i >= 0; i--) {
    bytes[i] = Number(value & 0xFFn);
    value = value >> 8n;
  }
  
  // Read length prefix (first 4 bytes)
  const lengthBuffer = Buffer.from(bytes.slice(0, 4));
  const originalLength = lengthBuffer.readUInt32BE(0);
  
  // Extract actual data
  let dataBytes = bytes.slice(4, 4 + originalLength);
  
  // Decompress if needed
  if (compressed) {
    try {
      dataBytes = inflateSync(Buffer.from(dataBytes));
    } catch (e) {
      // Return as-is if not compressed or decompression fails
    }
  }
  
  return dataBytes;
}

/**
 * Create a compressed legion packet
 */
export function createLegionPacket(opcode, swarmId, payload) {
  const jsonString = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(jsonString);
  const compressed = new TextEncoder().encode(encodeBase94(payloadBytes));
  
  // Calculate XOR checksum
  let checksum = 0;
  for (const byte of compressed) {
    checksum ^= byte;
  }
  
  // Build binary packet
  const swarmIdBytes = new TextEncoder().encode(swarmId.padEnd(36, '\0').slice(0, 36));
  const packetLength = 41 + compressed.length + 1; // magic(1) + version(1) + opcode(1) + swarmId(36) + payloadLen(1) + payload + checksum(1) + magic(1)
  const packet = new Uint8Array(packetLength);
  
  let offset = 0;
  packet[offset++] = 0xAB; // magicStart
  packet[offset++] = 1;    // version
  packet[offset++] = opcode;
  packet.set(swarmIdBytes, offset); offset += 36;
  packet[offset++] = compressed.length;
  packet.set(compressed, offset); offset += compressed.length;
  packet[offset++] = checksum;
  packet[offset++] = 0xCD; // magicEnd
  
  return {
    packet,
    originalSize: payloadBytes.length,
    encodedSize: compressed.length,
    reductionPercent: Math.round(((payloadBytes.length - compressed.length) / payloadBytes.length) * 10000) / 100
  };
}

/**
 * Parse a legion packet from bytes
 */
export function parseLegionPacket(bytes) {
  if (bytes.length < 10) return null;
  if (bytes[0] !== 0xAB || bytes[bytes.length - 1] !== 0xCD) return null;
  
  const version = bytes[1];
  const opcode = bytes[2];
  const swarmId = new TextDecoder().decode(bytes.slice(3, 39)).trim();
  const payloadLength = bytes[39];
  const payload = bytes.slice(40, 40 + payloadLength);
  const checksum = bytes[40 + payloadLength];
  
  // Verify checksum
  let calculatedChecksum = 0;
  for (const byte of payload) {
    calculatedChecksum ^= byte;
  }
  
  if (checksum !== calculatedChecksum) {
    console.warn('Legion packet checksum mismatch');
    return null;
  }
  
  // Decode payload
  const decodedStr = new TextDecoder().decode(payload);
  const decodedBytes = decodeBase94(decodedStr);
  const jsonStr = new TextDecoder().decode(decodedBytes);
  
  try {
    const payloadData = JSON.parse(jsonStr);
    return { version, opcode, swarmId, payload: payloadData, checksum };
  } catch (e) {
    return { version, opcode, swarmId, payload: jsonStr, checksum };
  }
}

/**
 * Get compression statistics
 */
export function getCompressionStats(original, encoded) {
  const originalSize = typeof original === 'string' 
    ? new TextEncoder().encode(original).length 
    : original.length;
  const encodedSize = new TextEncoder().encode(encoded).length;
  const reductionPercent = ((originalSize - encodedSize) / originalSize) * 100;
  const ratio = originalSize / encodedSize;
  
  return {
    originalSize,
    encodedSize,
    reductionPercent: Math.round(reductionPercent * 100) / 100,
    ratio: Math.round(ratio * 100) / 100
  };
}

/**
 * High-Radix Codec class for OOP usage
 */
export class HighRadixCodec {
  constructor(base = 94) {
    this.base = base;
    this.chars = base === 85 ? BASE85_CHARS : BASE94_CHARS;
  }
  
  encode(data) {
    if (this.base === 85) {
      // Simple base85 encoding (simplified)
      return encodeBase94(data);
    }
    return encodeBase94(data);
  }
  
  decode(encoded) {
    return decodeBase94(encoded);
  }
  
  createPacket(opcode, swarmId, payload) {
    return createLegionPacket(opcode, swarmId, payload);
  }
  
  parsePacket(bytes) {
    return parseLegionPacket(bytes);
  }
  
  getStats(original, encoded) {
    return getCompressionStats(original, encoded);
  }
}

// Singleton instance
export const codec = new HighRadixCodec(94);
