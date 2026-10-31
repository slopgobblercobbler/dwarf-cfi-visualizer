// test/extended_cfi.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { DwarfParser, DW_EH_PE, formatPointerEncoding } from "../js/dwarf_parser.js";
import { ARCHITECTURES, getRegisterName, getDefaultReturnAddressRegister, getStackPointerRegister } from "../js/arch_registers.js";
import { CfaStateMachine } from "../js/state_machine.js";
import { hexToBytes } from "../js/samples.js";

test("arch_registers provides accurate mappings across x86-64, AArch64, and i386", () => {
  // x86-64
  assert.equal(getRegisterName(16, ARCHITECTURES.X86_64), "rip");
  assert.equal(getRegisterName(7, ARCHITECTURES.X86_64), "rsp");
  assert.equal(getRegisterName(6, ARCHITECTURES.X86_64), "rbp");
  assert.equal(getDefaultReturnAddressRegister(ARCHITECTURES.X86_64), 16);
  assert.equal(getStackPointerRegister(ARCHITECTURES.X86_64), 7);

  // AArch64
  assert.equal(getRegisterName(30, ARCHITECTURES.AARCH64), "x30 (lr)");
  assert.equal(getRegisterName(31, ARCHITECTURES.AARCH64), "sp");
  assert.equal(getRegisterName(32, ARCHITECTURES.AARCH64), "pc");
  assert.equal(getDefaultReturnAddressRegister(ARCHITECTURES.AARCH64), 30);
  assert.equal(getStackPointerRegister(ARCHITECTURES.AARCH64), 31);

  // i386
  assert.equal(getRegisterName(8, ARCHITECTURES.I386), "eip");
  assert.equal(getRegisterName(4, ARCHITECTURES.I386), "esp");
  assert.equal(getDefaultReturnAddressRegister(ARCHITECTURES.I386), 8);
  assert.equal(getStackPointerRegister(ARCHITECTURES.I386), 4);
});

test("formatPointerEncoding translates DWARF pointer flags to human-readable text", () => {
  assert.equal(formatPointerEncoding(0xFF), "DW_EH_PE_omit");
  assert.equal(formatPointerEncoding(0x00), "DW_EH_PE_absptr");
  assert.equal(formatPointerEncoding(0x1B), "DW_EH_PE_pcrel | sdata4");
  assert.equal(formatPointerEncoding(0x9B), "DW_EH_PE_indirect | pcrel | sdata4");
  assert.equal(formatPointerEncoding(0x33), "DW_EH_PE_datarel | udata4");
});

test("hexToBytes rejects odd-length strings and cleans spaces, prefixes, commas", () => {
  assert.throws(() => hexToBytes("123"), /Invalid hex string length/);

  const clean = hexToBytes("0x12, 0x34 0x56\n0x78");
  assert.deepEqual(Array.from(clean), [0x12, 0x34, 0x56, 0x78]);
});

test("DwarfParser handles truncated records cleanly without crashing", () => {
  const truncated = new Uint8Array([0x20, 0x00, 0x00, 0x00, 0x00, 0x00]); // Claims 32 bytes, only provides 6
  const parser = new DwarfParser(truncated);
  const result = parser.parse();

  assert.ok(result.errors.length > 0);
  assert.match(result.errors[0], /exceeds buffer bounds/);
});

test("DwarfParser handles extended DWARF opcodes (val_offset, GNU_args_size, def_cfa_expression)", () => {
  // CIE (len = 20): "zR" with fde_enc 0x1B
  // FDE (len = 36):
  // DW_CFA_val_offset(3, 16): 0x14 0x03 0x10
  // DW_CFA_GNU_args_size(24): 0x2E 0x18
  // DW_CFA_def_cfa_expression(2 bytes [0x77, 0x08]): 0x0F 0x02 0x77 0x08
  const hex = [
    // CIE (len = 20):
    "14000000", "00000000", "01", "7a5200", "01", "78", "10", "01", "1b",
    "0c0708", "9001", "0000",
    // FDE (len = 36):
    "24000000", "1c000000", "00100000", "40000000", "00",
    "41",                 // advance_loc(1)
    "140310",             // DW_CFA_val_offset(reg=3, offset=16)
    "2e18",               // DW_CFA_GNU_args_size(24)
    "0f027708",           // DW_CFA_def_cfa_expression (len=2, expr: 77 08)
    "0000000000000000000000000000" // padding (14 bytes -> 36 bytes)
  ].join("");

  const parser = new DwarfParser(hexToBytes(hex));
  const result = parser.parse();

  assert.equal(result.errors.length, 0);
  const fde = result.fdes[0];
  assert.ok(fde.instructions.some(i => i.name === "DW_CFA_val_offset"));
  assert.ok(fde.instructions.some(i => i.name === "DW_CFA_GNU_args_size"));
  assert.ok(fde.instructions.some(i => i.name === "DW_CFA_def_cfa_expression"));
});
