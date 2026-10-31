// test/signed_displacement.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { BinaryReader } from "../js/binary_reader.js";
import { DW_EH_PE } from "../js/dwarf_parser.js";

test("Two's-Complement Displacement: Positive PC-relative displacement adds properly", () => {
  // Base: 0x401000, Disp: +0x200 (little endian: 00 02 00 00)
  const buf = new Uint8Array([0x00, 0x02, 0x00, 0x00]);
  const reader = new BinaryReader(buf);
  reader.baseVirtualAddress = 0x401000n;

  const enc = DW_EH_PE.pcrel | DW_EH_PE.sdata4; // 0x1B
  const result = reader.readEncodedPointer(enc);

  assert.equal(result.isOmitted, false);
  assert.equal(result.raw, 0x200n);
  assert.equal(result.value, 0x401200n);
});

test("Two's-Complement Displacement: Negative PC-relative displacement is properly sign-extended to 64-bit", () => {
  // Base: 0x402000
  // Negative displacement: -4096 (-0x1000)
  // Signed 32-bit int: 0xFFFFF000 -> LE bytes: 00 F0 FF FF
  const buf = new Uint8Array([0x00, 0xF0, 0xFF, 0xFF]);
  const reader = new BinaryReader(buf);
  reader.baseVirtualAddress = 0x402000n;

  const enc = DW_EH_PE.pcrel | DW_EH_PE.sdata4; // 0x1B
  const result = reader.readEncodedPointer(enc);

  assert.equal(result.isOmitted, false);
  // Verify sign-extended addition: 0x402000 - 0x1000 = 0x401000
  assert.equal(result.value, 0x401000n);

  // Negative control: Ensure it did NOT zero-extend to 0x402000 + 0xFFFFF000
  assert.notEqual(result.value, 0x402000n + 0xFFFFF000n);
});

test("Two's-Complement Displacement: Boundary case -1 displacement", () => {
  // Base: 0x500000
  // Disp: -1 (0xFFFFFFFF)
  const buf = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
  const reader = new BinaryReader(buf);
  reader.baseVirtualAddress = 0x500000n;

  const enc = DW_EH_PE.pcrel | DW_EH_PE.sdata4; // 0x1B
  const result = reader.readEncodedPointer(enc);

  assert.equal(result.value, 0x4FFFFFn);
});

test("Two's-Complement Displacement: DW_EH_PE_omit returns omitted flag", () => {
  const buf = new Uint8Array([0x00]);
  const reader = new BinaryReader(buf);
  const result = reader.readEncodedPointer(DW_EH_PE.omit);

  assert.equal(result.isOmitted, true);
  assert.equal(reader.offset, 0); // Omit reads zero bytes
});
