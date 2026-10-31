// test/dwarf_parser.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { DwarfParser } from "../js/dwarf_parser.js";
import { SAMPLES, hexToBytes } from "../js/samples.js";

test("DwarfParser parses Standard x86-64 CIE and FDE (Sample 1)", () => {
  const bytes = hexToBytes(SAMPLES.SAMPLE_1_STANDARD_X86_64.hex);
  const parser = new DwarfParser(bytes);
  const result = parser.parse();

  assert.equal(result.errors.length, 0);
  assert.equal(result.cies.length, 1);
  assert.equal(result.fdes.length, 1);

  const cie = result.cies[0];
  assert.equal(cie.version, 1);
  assert.equal(cie.augmentation, "zR");
  assert.equal(cie.codeAlignmentFactor, 1);
  assert.equal(cie.dataAlignmentFactor, -8);
  assert.equal(cie.returnAddressRegister, 16);
  assert.equal(cie.returnAddressName, "rip");
  assert.equal(cie.fdeEncoding, 0x1B);

  // Check initial instructions in CIE
  assert.ok(cie.instructions.length >= 2);
  const cfaInst = cie.instructions.find(i => i.name === "DW_CFA_def_cfa");
  assert.ok(cfaInst);
  assert.equal(cfaInst.operands.reg, 7);
  assert.equal(cfaInst.operands.offset, 8);

  const fde = result.fdes[0];
  assert.equal(fde.governingCie, cie);
  assert.equal(fde.addressRange, 0x45n);
  assert.ok(fde.instructions.length >= 6);

  // Check FDE instructions
  const adv1 = fde.instructions.find(i => i.name === "DW_CFA_advance_loc" && i.operands.delta === 1);
  assert.ok(adv1);

  const defCfaReg = fde.instructions.find(i => i.name === "DW_CFA_def_cfa_register");
  assert.ok(defCfaReg);
  assert.equal(defCfaReg.operands.reg, 6); // rbp
});

test("DwarfParser parses C++ Exception Frame with Personality and LSDA (Sample 2)", () => {
  const bytes = hexToBytes(SAMPLES.SAMPLE_2_CPP_EXCEPTION_LSDA.hex);
  const parser = new DwarfParser(bytes);
  const result = parser.parse();

  assert.equal(result.errors.length, 0);
  assert.equal(result.cies.length, 1);
  assert.equal(result.fdes.length, 1);

  const cie = result.cies[0];
  assert.equal(cie.augmentation, "zPLR");
  assert.equal(cie.personalityEncoding, 0x1B);
  assert.ok(cie.personalityPointer);
  assert.equal(cie.lsdaEncoding, 0x1B);

  const fde = result.fdes[0];
  assert.ok(fde.lsdaPointer);
  assert.equal(fde.addressRange, 0x80n);
});

test("DwarfParser handles negative displacement in FDE initial_location (Sample 4)", () => {
  const bytes = hexToBytes(SAMPLES.SAMPLE_4_SIGNED_TWOS_COMPLEMENT.hex);
  const parser = new DwarfParser(bytes, { baseVirtualAddress: 0x402000n });
  const result = parser.parse();

  assert.equal(result.errors.length, 0);
  assert.equal(result.fdes.length, 1);
  const fde = result.fdes[0];

  // initial_location should be computed by sign-extending -4096 (0xFFFFF000)
  // Verify it does not wrap around to uint64 overflow
  assert.ok(fde.initialLocation < 0x402000n + 0x100000000n);
});
