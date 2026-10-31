// binary_reader.js - Bounds-checked binary reader supporting DWARF & ELF data structures

export class BinaryReader {
  /**
   * @param {Uint8Array|ArrayBuffer} buffer
   * @param {number} [byteOffset=0]
   * @param {number} [byteLength]
   * @param {boolean} [littleEndian=true]
   */
  constructor(buffer, byteOffset = 0, byteLength, littleEndian = true) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = new Uint8Array(buffer, byteOffset, byteLength ?? (buffer.byteLength - byteOffset));
    } else if (buffer instanceof Uint8Array) {
      const start = buffer.byteOffset + byteOffset;
      const len = byteLength ?? (buffer.byteLength - byteOffset);
      this.buffer = new Uint8Array(buffer.buffer, start, len);
    } else {
      throw new TypeError("BinaryReader expects Uint8Array or ArrayBuffer");
    }

    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    this.offset = 0;
    this.littleEndian = littleEndian;
    this.baseVirtualAddress = 0n; // Virtual address corresponding to offset 0
  }

  get length() {
    return this.buffer.byteLength;
  }

  get remaining() {
    return Math.max(0, this.buffer.byteLength - this.offset);
  }

  isEOF() {
    return this.offset >= this.buffer.byteLength;
  }

  seek(newOffset) {
    if (newOffset < 0 || newOffset > this.buffer.byteLength) {
      throw new RangeError(`Seek offset ${newOffset} out of bounds [0, ${this.buffer.byteLength}]`);
    }
    this.offset = newOffset;
  }

  skip(bytes) {
    this.seek(this.offset + bytes);
  }

  checkBounds(size) {
    if (this.offset + size > this.buffer.byteLength) {
      throw new RangeError(
        `Buffer overrun: attempted to read ${size} bytes at offset ${this.offset}, total length ${this.buffer.byteLength}`
      );
    }
  }

  readUint8() {
    this.checkBounds(1);
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readInt8() {
    this.checkBounds(1);
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readUint16(littleEndian = this.littleEndian) {
    this.checkBounds(2);
    const val = this.view.getUint16(this.offset, littleEndian);
    this.offset += 2;
    return val;
  }

  readInt16(littleEndian = this.littleEndian) {
    this.checkBounds(2);
    const val = this.view.getInt16(this.offset, littleEndian);
    this.offset += 2;
    return val;
  }

  readUint32(littleEndian = this.littleEndian) {
    this.checkBounds(4);
    const val = this.view.getUint32(this.offset, littleEndian);
    this.offset += 4;
    return val;
  }

  readInt32(littleEndian = this.littleEndian) {
    this.checkBounds(4);
    const val = this.view.getInt32(this.offset, littleEndian);
    this.offset += 4;
    return val;
  }

  readUint64(littleEndian = this.littleEndian) {
    this.checkBounds(8);
    const val = this.view.getBigUint64(this.offset, littleEndian);
    this.offset += 8;
    return val;
  }

  readInt64(littleEndian = this.littleEndian) {
    this.checkBounds(8);
    const val = this.view.getBigInt64(this.offset, littleEndian);
    this.offset += 8;
    return val;
  }

  readBytes(count) {
    this.checkBounds(count);
    const slice = this.buffer.subarray(this.offset, this.offset + count);
    this.offset += count;
    return new Uint8Array(slice);
  }

  readNullTerminatedString() {
    const start = this.offset;
    while (this.offset < this.buffer.byteLength && this.buffer[this.offset] !== 0) {
      this.offset++;
    }
    if (this.offset >= this.buffer.byteLength) {
      throw new RangeError("Unterminated null-terminated string before EOF");
    }
    const bytes = this.buffer.subarray(start, this.offset);
    this.offset++; // skip null terminator
    return new TextDecoder().decode(bytes);
  }

  /**
   * Reads Unsigned LEB128
   * @returns {number|bigint}
   */
  readULEB128() {
    let result = 0n;
    let shift = 0n;
    let count = 0;
    while (true) {
      if (this.isEOF()) {
        throw new RangeError("Unexpected EOF while reading ULEB128");
      }
      const byte = BigInt(this.readUint8());
      result |= (byte & 0x7Fn) << shift;
      shift += 7n;
      count++;
      if ((byte & 0x80n) === 0n) break;
      if (count > 10) {
        throw new RangeError("ULEB128 sequence exceeded maximum 10 bytes");
      }
    }
    if (result <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return Number(result);
    }
    return result;
  }

  /**
   * Reads Signed LEB128
   * @returns {number|bigint}
   */
  readSLEB128() {
    let result = 0n;
    let shift = 0n;
    let count = 0;
    let byte = 0n;
    while (true) {
      if (this.isEOF()) {
        throw new RangeError("Unexpected EOF while reading SLEB128");
      }
      byte = BigInt(this.readUint8());
      result |= (byte & 0x7Fn) << shift;
      shift += 7n;
      count++;
      if ((byte & 0x80n) === 0n) break;
      if (count > 10) {
        throw new RangeError("SLEB128 sequence exceeded maximum 10 bytes");
      }
    }
    if (shift < 64n && (byte & 0x40n) !== 0n) {
      result |= (~0n << shift);
    }
    const signed64 = BigInt.asIntN(64, result);
    if (signed64 >= BigInt(Number.MIN_SAFE_INTEGER) && signed64 <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return Number(signed64);
    }
    return signed64;
  }

  /**
   * Reads DWARF encoded pointer per DW_EH_PE_* specification.
   * Strictly enforces signed two's-complement arithmetic for PC-relative displacements.
   *
   * @param {number} encoding - DWARF pointer encoding byte (DW_EH_PE_*)
   * @param {bigint|number} [pcRelBase] - Virtual address or offset base for DW_EH_PE_pcrel
   * @param {number} [ptrSize=8] - Target architecture pointer size (4 or 8)
   * @returns {{ value: bigint|number, raw: bigint|number, isOmitted: boolean, encoding: number }}
   */
  readEncodedPointer(encoding, pcRelBase, ptrSize = 8) {
    if (encoding === 0xFF) { // DW_EH_PE_omit
      return { value: 0n, raw: 0n, isOmitted: true, encoding };
    }

    const valueFormat = encoding & 0x0F;
    const modifier = encoding & 0x70;
    const isIndirect = (encoding & 0x80) !== 0;

    const readOffset = this.offset;
    let rawValue = 0n;
    let isSigned = false;

    switch (valueFormat) {
      case 0x00: // DW_EH_PE_absptr
        rawValue = ptrSize === 8 ? this.readUint64() : BigInt(this.readUint32());
        break;
      case 0x01: // DW_EH_PE_uleb128
        rawValue = BigInt(this.readULEB128());
        break;
      case 0x02: // DW_EH_PE_udata2
        rawValue = BigInt(this.readUint16());
        break;
      case 0x03: // DW_EH_PE_udata4
        rawValue = BigInt(this.readUint32());
        break;
      case 0x04: // DW_EH_PE_udata8
        rawValue = this.readUint64();
        break;
      case 0x09: // DW_EH_PE_sleb128
        rawValue = BigInt(this.readSLEB128());
        isSigned = true;
        break;
      case 0x0A: // DW_EH_PE_sdata2
        rawValue = BigInt(this.readInt16());
        isSigned = true;
        break;
      case 0x0B: // DW_EH_PE_sdata4 (int32_t displacement)
        rawValue = BigInt(this.readInt32());
        isSigned = true;
        break;
      case 0x0C: // DW_EH_PE_sdata8 (int64_t displacement)
        rawValue = this.readInt64();
        isSigned = true;
        break;
      default:
        throw new Error(`Unsupported DWARF pointer encoding value format: 0x${valueFormat.toString(16)}`);
    }

    let calculatedValue = rawValue;

    if (modifier === 0x10) { // DW_EH_PE_pcrel
      // TWO'S-COMPLEMENT SIGN EXTENSION:
      // Base address is the virtual address where the value was read from
      const base = pcRelBase !== undefined ? BigInt(pcRelBase) : (this.baseVirtualAddress + BigInt(readOffset));
      // Signed addition: int64_t(int32_t(disp)) + base
      const signedDisp = isSigned ? BigInt.asIntN(64, rawValue) : rawValue;
      calculatedValue = BigInt.asUintN(64, base + signedDisp);
    } else if (modifier === 0x20) { // DW_EH_PE_textrel
      const base = pcRelBase !== undefined ? BigInt(pcRelBase) : 0n;
      calculatedValue = BigInt.asUintN(64, base + rawValue);
    } else if (modifier === 0x30) { // DW_EH_PE_datarel
      const base = pcRelBase !== undefined ? BigInt(pcRelBase) : 0n;
      calculatedValue = BigInt.asUintN(64, base + rawValue);
    } else if (modifier === 0x40) { // DW_EH_PE_funcrel
      const base = pcRelBase !== undefined ? BigInt(pcRelBase) : 0n;
      calculatedValue = BigInt.asUintN(64, base + rawValue);
    } else if (modifier === 0x50) { // DW_EH_PE_aligned
      // Aligned pointer
      calculatedValue = rawValue;
    }

    return {
      value: calculatedValue,
      raw: rawValue,
      isOmitted: false,
      isIndirect,
      encoding,
      readOffset
    };
  }

  slice(start, length) {
    const subLength = length ?? (this.buffer.byteLength - start);
    if (start < 0 || subLength < 0 || start + subLength > this.buffer.byteLength) {
      throw new RangeError(
        `Slice range [${start}, ${start + subLength}] exceeds buffer size ${this.buffer.byteLength}`
      );
    }
    const subReader = new BinaryReader(this.buffer, start, subLength, this.littleEndian);
    subReader.baseVirtualAddress = this.baseVirtualAddress + BigInt(start);
    return subReader;
  }
}
