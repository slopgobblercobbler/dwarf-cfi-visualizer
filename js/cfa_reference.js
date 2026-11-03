/**
 * DWARF Call Frame Instruction (CFA) Opcode Reference
 * Defines canonical CFA instruction opcodes and operand decoding schemas.
 */

const DWARF_CFA_OPCODES = [
  { opcode: 0x00, name: "DW_CFA_nop", description: "Padding instruction with no operational effect" },
  { opcode: 0x01, name: "DW_CFA_set_loc", description: "Set location pointer to specified target address", operand: "address" },
  { opcode: 0x02, name: "DW_CFA_advance_loc1", description: "Advance location pointer by 1-byte delta * code_alignment_factor", operand: "uint8" },
  { opcode: 0x03, name: "DW_CFA_advance_loc2", description: "Advance location pointer by 2-byte delta * code_alignment_factor", operand: "uint16" },
  { opcode: 0x04, name: "DW_CFA_advance_loc4", description: "Advance location pointer by 4-byte delta * code_alignment_factor", operand: "uint32" },
  { opcode: 0x05, name: "DW_CFA_offset_extended", description: "Save register at CFA + ULEB128 offset * data_alignment_factor", operands: ["uleb128", "uleb128"] },
  { opcode: 0x06, name: "DW_CFA_restore_extended", description: "Restore register rule to initial CIE rule", operand: "uleb128" },
  { opcode: 0x07, name: "DW_CFA_undefined", description: "Set register rule to undefined", operand: "uleb128" },
  { opcode: 0x08, name: "DW_CFA_same_value", description: "Set register rule to unchanged / same value", operand: "uleb128" },
  { opcode: 0x09, name: "DW_CFA_register", description: "Set register rule to stored in another register", operands: ["uleb128", "uleb128"] },
  { opcode: 0x0a, name: "DW_CFA_remember_state", description: "Push current register and CFA state onto internal stack" },
  { opcode: 0x0b, name: "DW_CFA_restore_state", description: "Pop previous register and CFA state from internal stack" },
  { opcode: 0x0c, name: "DW_CFA_def_cfa", description: "Define CFA rule using base register and unsigned offset", operands: ["uleb128", "uleb128"] },
  { opcode: 0x0d, name: "DW_CFA_def_cfa_register", description: "Update CFA rule register preserving existing offset", operand: "uleb128" },
  { opcode: 0x0e, name: "DW_CFA_def_cfa_offset", description: "Update CFA rule offset preserving existing register", operand: "uleb128" },
  { opcode: 0x11, name: "DW_CFA_offset_extended_sf", description: "Save register with signed SLEB128 factored offset", operands: ["uleb128", "sleb128"] },
  { opcode: 0x12, name: "DW_CFA_def_cfa_sf", description: "Define CFA rule with signed SLEB128 factored offset", operands: ["uleb128", "sleb128"] },
  { opcode: 0x13, name: "DW_CFA_def_cfa_offset_sf", description: "Update CFA offset with signed SLEB128 factored offset", operand: "sleb128" }
];

function getCfaOpcodeInfo(op) {
  return DWARF_CFA_OPCODES.find(entry => entry.opcode === op) || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DWARF_CFA_OPCODES, getCfaOpcodeInfo };
}
