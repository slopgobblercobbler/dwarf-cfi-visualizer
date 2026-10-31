// test/binary_reader.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { BinaryReader } from "../js/binary_reader.js";

test("BinaryReader reads primitive types with correct endianness", () => {
  const buf = new Uint8Array([
    0x12, 0x34,             // uint16 LE: 0x3412
    0x78, 0x56, 0x34, 0x12, // uint32 LE: 0x12345678
    0xEF, 0xBE, 0xAD, 0xDE, 0x01, 0x00, 0x00, 0x00 // uint64 LE
  ]);
  const reader = new BinaryReader(buf);

  assert.equal(reader.readUint16(), 0x3412);
  assert.equal(reader.readUint32(), 0x12345678);
  assert.equal(reader.readUint64(), 0x00000001DEADBEEFn);
  assert.equal(reader.isEOF(), true);
});

test("BinaryReader reads ULEB128 correctly", () => {
  // Test single-byte ULEB128: 0, 1, 127
  let reader = new BinaryReader(new Uint8Array([0x00]));
  assert.equal(reader.readULEB128(), 0);

  reader = new BinaryReader(new Uint8Array([0x01]));
  assert.equal(reader.readULEB128(), 1);

  reader = new BinaryReader(new Uint8Array([0x7F]));
  assert.equal(reader.readULEB128(), 127);

  // Multi-byte ULEB128: 128 (0x80 0x01), 624485 (0xE5 0x8E 0x26)
  reader = new BinaryReader(new Uint8Array([0x80, 0x01]));
  assert.equal(reader.readULEB128(), 128);

  reader = new BinaryReader(new Uint8Array([0xE5, 0x8E, 0x26]));
  assert.equal(reader.readULEB128(), 624485);
});

test("BinaryReader reads SLEB128 correctly", () => {
  // Positive SLEB128: 0, 1, 63
  let reader = new BinaryReader(new Uint8Array([0x00]));
  assert.equal(reader.readSLEB128(), 0);

  reader = new BinaryReader(new Uint8Array([0x01]));
  assert.equal(reader.readSLEB128(), 1);

  reader = new BinaryReader(new Uint8Array([0x3F]));
  assert.equal(reader.readSLEB128(), 63);

  // Negative SLEB128: -1 (0x7F), -8 (0x78), -624485 (0x9B 0xF1 0x59)
  reader = new BinaryReader(new Uint8Array([0x7F]));
  assert.equal(reader.readSLEB128(), -1);

  reader = new BinaryReader(new Uint8Array([0x78]));
  assert.equal(reader.readSLEB128(), -8);

  reader = new BinaryReader(new Uint8Array([0x9B, 0xF1, 0x59]));
  assert.equal(reader.readSLEB128(), -624485);
});

test("BinaryReader enforces bounds and prevents buffer overrun", () => {
  const buf = new Uint8Array([0x01, 0x02]);
  const reader = new BinaryReader(buf);

  assert.equal(reader.readUint8(), 1);
  assert.equal(reader.readUint8(), 2);
  assert.throws(() => reader.readUint8(), RangeError);
  assert.throws(() => reader.seek(10), RangeError);
});

test("BinaryReader slices sub-readers with preserved virtual address tracking", () => {
  const buf = new Uint8Array(32);
  const reader = new BinaryReader(buf);
  reader.baseVirtualAddress = 0x400000n;

  const slice = reader.slice(8, 16);
  assert.equal(slice.length, 16);
  assert.equal(slice.baseVirtualAddress, 0x400008n);
});
