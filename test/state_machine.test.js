// test/state_machine.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { DwarfParser } from "../js/dwarf_parser.js";
import { CfaStateMachine } from "../js/state_machine.js";
import { SAMPLES, hexToBytes } from "../js/samples.js";

test("CfaStateMachine generates unwind matrix for standard x86-64 function", () => {
  const bytes = hexToBytes(SAMPLES.SAMPLE_1_STANDARD_X86_64.hex);
  const parser = new DwarfParser(bytes);
  const result = parser.parse();

  const cie = result.cies[0];
  const fde = result.fdes[0];

  const sm = new CfaStateMachine(cie, fde);
  const matrix = sm.generateMatrix();

  assert.ok(matrix.rows.length >= 4);

  // Initial row at function entry
  const row0 = matrix.rows[0];
  assert.equal(row0.formattedCfa, "rsp+8");
  assert.equal(row0.registers[16]?.formatted, "cfa-8"); // rip

  // Find row after push %rbp and mov %rsp, %rbp
  const rbpRow = matrix.rows.find(r => r.formattedCfa === "rbp+16");
  assert.ok(rbpRow, "Matrix must reflect CFA = rbp+16 after def_cfa_register(6)");
  assert.equal(rbpRow.registers[6]?.formatted, "cfa-16"); // rbp saved at cfa-16
});

test("CfaStateMachine executes remember_state and restore_state cleanly", () => {
  const bytes = hexToBytes(SAMPLES.SAMPLE_3_REMEMBER_RESTORE_STATE.hex);
  const parser = new DwarfParser(bytes);
  const result = parser.parse();

  const cie = result.cies[0];
  const fde = result.fdes[0];

  const sm = new CfaStateMachine(cie, fde);
  const matrix = sm.generateMatrix();

  // Verify that remember_state pushed and restore_state returned CFA to previous offset
  const expandedRow = matrix.rows.find(r => r.formattedCfa === "rsp+48");
  assert.ok(expandedRow, "Must record stack expansion to rsp+48");

  const restoredRow = matrix.rows.find((r, idx) => idx > 0 && r.formattedCfa === "rsp+8");
  assert.ok(restoredRow, "Must restore back to rsp+8 after restore_state and epilogue");
});
