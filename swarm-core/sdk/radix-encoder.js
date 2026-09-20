/**
 * Radix-Swarm SDK
 * 
 * High-radix base encoding for compact command propagation.
 * Allows a single process to command legions of agents via dense token streams.
 * 
 * Base64 -> Base85 -> Base94 (Printable ASCII) progression for maximum density.
 */

const BASE94_CHARS = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

class RadixEncoder {
  constructor(base = 94) {
    this.base = Math.min(Math.max(base, 2), 94);
    this.chars = BASE94_CHARS.substring(0, this.base);
  }

  encode(buffer) {
    if (this.base === 94) return this.toBase94(buffer);
    if (this.base === 85) return this.toBase85(buffer);
    return this.toGeneric(buffer);
  }

  decode(str) {
    if (this.base === 94) return this.fromBase94(str);
    if (this.base === 85) return this.fromBase85(str);
    return this.fromGeneric(str);
  }

  toBase94(buffer) {
    let result = '';
    let value = 0n;
    const bigBase = 256n;
    
    // Convert buffer to big integer
    for (const byte of buffer) {
      value = (value * bigBase) + BigInt(byte);
    }

    // Convert to base94
    const bigRadix = BigInt(this.base);
    if (value === 0n) return this.chars[0];

    while (value > 0n) {
      result = this.chars[Number(value % bigRadix)] + result;
      value = value / bigRadix;
    }

    return result;
  }

  fromBase94(str) {
    const bigRadix = BigInt(this.base);
    let value = 0n;

    for (const char of str) {
      const index = this.chars.indexOf(char);
      if (index === -1) throw new Error(`Invalid character ${char} for base${this.base}`);
      value = (value * bigRadix) + BigInt(index);
    }

    // Convert back to buffer
    const hex = value.toString(16);
    const paddedHex = hex.length % 2 ? '0' + hex : hex;
    const bytes = [];
    for (let i = 0; i < paddedHex.length; i += 2) {
      bytes.push(parseInt(paddedHex.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
  }

  toBase85(buffer) {
    // Standard Ascii85-like encoding
    const result = [];
    for (let i = 0; i < buffer.length; i += 4) {
      let chunk = 0;
      let count = 0;
      for (let j = 0; j < 4; j++) {
        chunk = (chunk << 8) | (buffer[i + j] || 0);
        count++;
      }
      
      // Pad with 1s if partial chunk
      if (count < 4) {
        chunk = chunk << (8 * (4 - count));
      }

      const digits = [];
      for (let k = 0; k < 5; k++) {
        digits.unshift(chunk % 85);
        chunk = Math.floor(chunk / 85);
      }

      // Trim padding
      const outputCount = count === 0 ? 0 : count + 1;
      for (let k = 0; k < outputCount; k++) {
        result.push(BASE94_CHARS[digits[k] + 33]); // Offset to printable
      }
    }
    return result.join('');
  }

  fromBase85(str) {
    // Inverse of toBase85
    const buffer = [];
    const values = [];
    
    for (const char of str) {
      const code = BASE94_CHARS.indexOf(char) - 33;
      if (code < 0 || code >= 85) continue;
      values.push(code);
    }

    for (let i = 0; i < values.length; i += 5) {
      let chunk = 0;
      for (let j = 0; j < 5; j++) {
        chunk = chunk * 85 + (values[i + j] || 0);
      }
      
      const bytes = [];
      for (let k = 0; k < 4; k++) {
        bytes.unshift(chunk & 0xFF);
        chunk >>= 8;
      }
      
      // Handle padding logic based on group size if needed
      buffer.push(...bytes);
    }
    
    return Buffer.from(buffer);
  }

  toGeneric(buffer) {
    // Fallback generic conversion
    return this.toBase94(buffer);
  }

  fromGeneric(str) {
    return this.fromBase94(str);
  }
}

module.exports = { RadixEncoder };
