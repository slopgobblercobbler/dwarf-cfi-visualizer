// state_machine.js - DWARF CFA State Machine & Unwind Table Generator

import { getRegisterName, ARCHITECTURES } from "./arch_registers.js";

export class CfaStateMachine {
  /**
   * @param {object} cie - Parsed CIE object
   * @param {object} [fde] - Parsed FDE object
   * @param {string} [arch="x86_64"]
   */
  constructor(cie, fde = null, arch = ARCHITECTURES.X86_64) {
    this.cie = cie;
    this.fde = fde;
    this.arch = arch;

    // Current evaluation state
    this.loc = fde ? fde.initialLocation : 0n;
    this.cfa = { type: "register_offset", reg: 7, offset: 8 }; // Default rsp+8
    this.registers = new Map(); // regNum -> rule object
    this.stateStack = [];

    // History of snapshots for table rendering
    this.rows = [];
    this.activeRegisters = new Set();
  }

  cloneState() {
    const regClone = new Map();
    for (const [k, v] of this.registers.entries()) {
      regClone.set(k, { ...v });
    }
    return {
      cfa: { ...this.cfa },
      registers: regClone
    };
  }

  formatCfa(cfa = this.cfa) {
    if (cfa.type === "register_offset") {
      const regName = getRegisterName(cfa.reg, this.arch);
      if (cfa.offset === 0) return regName;
      const sign = cfa.offset > 0 ? "+" : "-";
      return `${regName}${sign}${Math.abs(cfa.offset)}`;
    }
    if (cfa.type === "expression") {
      return `expr(${cfa.exprLen || 0}b)`;
    }
    return "unknown";
  }

  formatRegisterRule(rule) {
    if (!rule) return "u"; // undefined
    switch (rule.type) {
      case "undefined": return "u";
      case "same_value": return "s";
      case "offset": {
        const sign = rule.offset >= 0 ? "+" : "";
        return `cfa${sign}${rule.offset}`;
      }
      case "val_offset": {
        const sign = rule.offset >= 0 ? "+" : "";
        return `[cfa${sign}${rule.offset}]`;
      }
      case "register":
        return getRegisterName(rule.targetReg, this.arch);
      case "expression":
        return `exp`;
      case "val_expression":
        return `val_exp`;
      default:
        return "u";
    }
  }

  recordSnapshot(reason = "") {
    const snapshotRegisters = {};
    for (const reg of this.activeRegisters) {
      const rule = this.registers.get(reg);
      snapshotRegisters[reg] = {
        rule,
        formatted: this.formatRegisterRule(rule),
        regName: getRegisterName(reg, this.arch)
      };
    }

    const startLoc = this.fde ? this.fde.initialLocation : 0n;
    const relOffset = Number(this.loc - startLoc);

    this.rows.push({
      loc: this.loc,
      relativePc: relOffset,
      formattedLoc: `0x${this.loc.toString(16)}`,
      formattedRel: `+0x${relOffset.toString(16)}`,
      cfa: { ...this.cfa },
      formattedCfa: this.formatCfa(this.cfa),
      registers: snapshotRegisters,
      reason
    });
  }

  executeInstruction(inst) {
    switch (inst.name) {
      case "DW_CFA_advance_loc":
      case "DW_CFA_advance_loc1":
      case "DW_CFA_advance_loc2":
      case "DW_CFA_advance_loc4": {
        // Record snapshot for previous location before advancing
        this.recordSnapshot(`Advance PC by ${inst.operands.delta}`);
        this.loc += BigInt(inst.operands.delta);
        break;
      }

      case "DW_CFA_set_loc": {
        this.recordSnapshot(`Set PC to 0x${inst.operands.loc.toString(16)}`);
        this.loc = BigInt(inst.operands.loc);
        break;
      }

      case "DW_CFA_def_cfa": {
        this.cfa = {
          type: "register_offset",
          reg: inst.operands.reg,
          offset: inst.operands.offset
        };
        break;
      }

      case "DW_CFA_def_cfa_register": {
        if (this.cfa.type === "register_offset") {
          this.cfa.reg = inst.operands.reg;
        } else {
          this.cfa = { type: "register_offset", reg: inst.operands.reg, offset: 0 };
        }
        break;
      }

      case "DW_CFA_def_cfa_offset": {
        if (this.cfa.type === "register_offset") {
          this.cfa.offset = inst.operands.offset;
        }
        break;
      }

      case "DW_CFA_def_cfa_sf": {
        this.cfa = {
          type: "register_offset",
          reg: inst.operands.reg,
          offset: inst.operands.offset
        };
        break;
      }

      case "DW_CFA_def_cfa_offset_sf": {
        if (this.cfa.type === "register_offset") {
          this.cfa.offset = inst.operands.offset;
        }
        break;
      }

      case "DW_CFA_def_cfa_expression": {
        this.cfa = {
          type: "expression",
          exprBytes: inst.operands.exprBytes,
          exprLen: inst.operands.exprLen
        };
        break;
      }

      case "DW_CFA_offset":
      case "DW_CFA_offset_extended":
      case "DW_CFA_offset_extended_sf": {
        const reg = inst.operands.reg;
        const byteOffset = inst.operands.byteOffset;
        this.activeRegisters.add(reg);
        this.registers.set(reg, { type: "offset", offset: byteOffset });
        break;
      }

      case "DW_CFA_val_offset":
      case "DW_CFA_val_offset_sf": {
        const reg = inst.operands.reg;
        const byteOffset = inst.operands.offset;
        this.activeRegisters.add(reg);
        this.registers.set(reg, { type: "val_offset", offset: byteOffset });
        break;
      }

      case "DW_CFA_restore":
      case "DW_CFA_restore_extended": {
        const reg = inst.operands.reg;
        this.activeRegisters.add(reg);
        if (this.cieInitialRegisters && this.cieInitialRegisters.has(reg)) {
          this.registers.set(reg, { ...this.cieInitialRegisters.get(reg) });
        } else {
          this.registers.delete(reg);
        }
        break;
      }

      case "DW_CFA_undefined": {
        const reg = inst.operands.reg;
        this.activeRegisters.add(reg);
        this.registers.set(reg, { type: "undefined" });
        break;
      }

      case "DW_CFA_same_value": {
        const reg = inst.operands.reg;
        this.activeRegisters.add(reg);
        this.registers.set(reg, { type: "same_value" });
        break;
      }

      case "DW_CFA_register": {
        const reg1 = inst.operands.reg1;
        const reg2 = inst.operands.reg2;
        this.activeRegisters.add(reg1);
        this.registers.set(reg1, { type: "register", targetReg: reg2 });
        break;
      }

      case "DW_CFA_remember_state": {
        this.stateStack.push(this.cloneState());
        break;
      }

      case "DW_CFA_restore_state": {
        if (this.stateStack.length > 0) {
          const restored = this.stateStack.pop();
          this.cfa = restored.cfa;
          this.registers = restored.registers;
          for (const reg of restored.registers.keys()) {
            this.activeRegisters.add(reg);
          }
        }
        break;
      }

      case "DW_CFA_expression": {
        const reg = inst.operands.reg;
        this.activeRegisters.add(reg);
        this.registers.set(reg, {
          type: "expression",
          exprBytes: inst.operands.exprBytes
        });
        break;
      }

      case "DW_CFA_val_expression": {
        const reg = inst.operands.reg;
        this.activeRegisters.add(reg);
        this.registers.set(reg, {
          type: "val_expression",
          exprBytes: inst.operands.exprBytes
        });
        break;
      }

      case "DW_CFA_nop":
      case "DW_CFA_GNU_args_size":
      case "DW_CFA_GNU_window_save":
      default:
        break;
    }
  }

  /**
   * Evaluates the CIE and FDE to generate the full Unwind Table Matrix
   * @returns {{ rows: Array, columns: Array<number>, cieRows: Array }}
   */
  generateMatrix() {
    // Phase 1: Pre-scan all instructions to collect all registers ever referenced
    if (this.cie.instructions) {
      for (const inst of this.cie.instructions) {
        if (inst.operands?.reg !== undefined) this.activeRegisters.add(inst.operands.reg);
        if (inst.operands?.reg1 !== undefined) this.activeRegisters.add(inst.operands.reg1);
      }
    }
    if (this.cie.returnAddressRegister !== undefined) {
      this.activeRegisters.add(this.cie.returnAddressRegister);
    }
    if (this.fde?.instructions) {
      for (const inst of this.fde.instructions) {
        if (inst.operands?.reg !== undefined) this.activeRegisters.add(inst.operands.reg);
        if (inst.operands?.reg1 !== undefined) this.activeRegisters.add(inst.operands.reg1);
      }
    }

    // Phase 2: Execute CIE initial instructions
    this.loc = 0n;
    if (this.cie.instructions) {
      for (const inst of this.cie.instructions) {
        this.executeInstruction(inst);
      }
    }

    // Save CIE initial state for 'DW_CFA_restore'
    this.cieInitialCfa = { ...this.cfa };
    this.cieInitialRegisters = new Map();
    for (const [k, v] of this.registers.entries()) {
      this.cieInitialRegisters.set(k, { ...v });
    }

    // Phase 3: Execute FDE instructions if provided
    if (this.fde) {
      this.loc = this.fde.initialLocation;
      if (this.fde.instructions) {
        for (const inst of this.fde.instructions) {
          this.executeInstruction(inst);
        }
      }
    }

    // Final snapshot for the ending state
    this.recordSnapshot("Final frame state");

    // Order columns: return address reg first (or last), followed by callee-saved registers
    const columns = Array.from(this.activeRegisters).sort((a, b) => a - b);

    return {
      rows: this.rows,
      columns,
      columnNames: columns.map(c => ({ reg: c, name: getRegisterName(c, this.arch) }))
    };
  }
}
