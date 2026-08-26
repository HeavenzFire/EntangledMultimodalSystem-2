/**
 * High-Radix Codec for Neural Mesh Command Compression
 * Supports Base85, Base94, and custom radix encodings for legion-scale swarm control
 */

import { encode as base85Encode, decode as base85Decode } from 'base85';
import { v4 as uuidv4 } from 'uuid';

export type RadixBase = 85 | 94 | 128 | 256;

export interface LegionPacket {
  magicStart: number;      // 0xAB
  version: number;         // Protocol version
  opcode: LegionOpcode;    // Command type
  swarmId: string;         // Target swarm identifier
  payloadLength: number;   // Length of compressed payload
  payload: Uint8Array;     // Compressed command data
  checksum: number;        // Simple XOR checksum
  magicEnd: number;        // 0xCD
}

export enum LegionOpcode {
  SPAWN = 0x01,
  KILL = 0x02,
  MIGRATE = 0x03,
  SYNC = 0x04,
  BROADCAST = 0x05,
  CONVERGE = 0x06,
  DIVERGE = 0x07,
  REPORT = 0x08
}

export class HighRadixCodec {
  private readonly printableChars: string;
  
  constructor(base: RadixBase = 94) {
    if (base === 94) {
      // ASCII 33-126 (! to ~)
      this.printableChars = '!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    } else if (base === 85) {
      // Z85 subset
      this.printableChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';
    } else {
      throw new Error(`Unsupported radix base: ${base}`);
    }
  }

  /**
   * Encode arbitrary data to high-radix string
   */
  encode(data: Uint8Array | string): string {
    const bytes = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data;
    
    if (this.printableChars.length === 85) {
      return base85Encode(bytes);
    }
    
    // Custom Base94 encoding
    let result = '';
    let value = 0n;
    const base = BigInt(this.printableChars.length);
    
    // Convert bytes to big integer
    for (const byte of bytes) {
      value = (value << 8n) | BigInt(byte);
    }
    
    // Convert to base94
    const chars = this.printableChars.split('');
    while (value > 0n) {
      const remainder = value % base;
      result = chars[Number(remainder)] + result;
      value = value / base;
    }
    
    return result || chars[0];
  }

  /**
   * Decode high-radix string back to bytes
   */
  decode(encoded: string): Uint8Array {
    if (this.printableChars.length === 85) {
      return base85Decode(encoded);
    }
    
    // Custom Base94 decoding
    const chars = this.printableChars.split('');
    const charMap = new Map(chars.map((c, i) => [c, BigInt(i)]));
    const base = BigInt(chars.length);
    
    let value = 0n;
    for (const char of encoded) {
      value = (value * base) + (charMap.get(char) || 0n);
    }
    
    // Convert back to bytes
    const byteLength = Math.ceil((encoded.length * Math.log2(chars.length)) / 8);
    const bytes = new Uint8Array(byteLength);
    
    for (let i = byteLength - 1; i >= 0; i--) {
      bytes[i] = Number(value & 0xFFn);
      value = value >> 8n;
    }
    
    return bytes;
  }

  /**
   * Create a compressed legion packet
   */
  createLegionPacket(
    opcode: LegionOpcode,
    swarmId: string,
    payload: Uint8Array | string
  ): LegionPacket {
    const payloadBytes = typeof payload === 'string' 
      ? new TextEncoder().encode(payload) 
      : payload;
    
    const compressed = new TextEncoder().encode(this.encode(payloadBytes));
    
    // Calculate XOR checksum
    let checksum = 0;
    for (const byte of compressed) {
      checksum ^= byte;
    }
    
    return {
      magicStart: 0xAB,
      version: 1,
      opcode,
      swarmId,
      payloadLength: compressed.length,
      payload: compressed,
      checksum,
      magicEnd: 0xCD
    };
  }

  /**
   * Parse a legion packet from bytes
   */
  parseLegionPacket(bytes: Uint8Array): LegionPacket | null {
    if (bytes.length < 10) return null;
    if (bytes[0] !== 0xAB || bytes[bytes.length - 1] !== 0xCD) return null;
    
    const version = bytes[1];
    const opcode = bytes[2] as LegionOpcode;
    
    // Extract swarmId (assuming 36 bytes for UUID)
    const swarmIdBytes = bytes.slice(3, 39);
    const swarmId = new TextDecoder().decode(swarmIdBytes);
    
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
    
    return {
      magicStart: 0xAB,
      version,
      opcode,
      swarmId: swarmId.trim(),
      payloadLength,
      payload,
      checksum,
      magicEnd: 0xCD
    };
  }

  /**
   * Generate compression statistics
   */
  getCompressionStats(original: Uint8Array, encoded: string): {
    originalSize: number;
    encodedSize: number;
    reductionPercent: number;
    ratio: number;
  } {
    const originalSize = original.length;
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
}

// Singleton instance for common usage
export const codec = new HighRadixCodec(94);

// Utility functions for quick access
export const encodeCommand = (data: string) => codec.encode(data);
export const decodeCommand = (encoded: string) => codec.decode(encoded);
export const createLegionPacket = (opcode: LegionOpcode, swarmId: string, payload: string) => 
  codec.createLegionPacket(opcode, swarmId, payload);
