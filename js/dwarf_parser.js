// dwarf_parser.js - DWARF Call Frame Information (.eh_frame / .debug_frame) Parser

import { BinaryReader } from "./binary_reader.js";
import { getRegisterName, ARCHITECTURES } from "./arch_registers.js";

export const DW_EH_PE = {
  absptr: 0x00,
  uleb128: 0x01,
  udata2: 0x02,
  udata4: 0x03,
  udata8: 0x04,
  sleb128: 0x09,
  sdata2: 0x0A,
  sdata4: 0x0B,
  sdata8: 0x0C,
  pcrel: 0x10,
  textrel: 0x20,
  datarel: 0x30,
  funcrel: 0x40,
  aligned: 0x50,
  indirect: 0x80,
  omit: 0xFF
};

export function formatPointerEncoding(enc) {
  if (enc === 0xFF) return "DW_EH_PE_omit";
  const parts = [];
  if (enc & 0x80) parts.push("indirect");
  const mod = enc & 0x70;
  if (mod === 0x10) parts.push("pcrel");
  else if (mod === 0x20) parts.push("textrel");
  else if (mod === 0x30) parts.push("datarel");
  else if (mod === 0x40) parts.push("funcrel");
  else if (mod === 0x50) parts.push("aligned");

  const fmt = enc & 0x0F;
  switch (fmt) {
    case 0x00: parts.push("absptr"); break;
    case 0x01: parts.push("uleb128"); break;
    case 0x02: parts.push("udata2"); break;
    case 0x03: parts.push("udata4"); break;
    case 0x04: parts.push("udata8"); break;
    case 0x09: parts.push("sleb128"); break;
    case 0x0A: parts.push("sdata2"); break;
    case 0x0B: parts.push("sdata4"); break;
    case 0x0C: parts.push("sdata8"); break;
    default: parts.push(`0x${fmt.toString(16)}`); break;
  }
  return `DW_EH_PE_${parts.join(" | ")}`;
}

export class DwarfParser {
  /**
   * @param {Uint8Array|ArrayBuffer} buffer
   * @param {object} [options]
   * @param {boolean} [options.isDebugFrame=false]
   * @param {bigint|number} [options.baseVirtualAddress=0n]
   * @param {string} [options.arch="x86_64"]
   */
  constructor(buffer, options = {}) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.isDebugFrame = options.isDebugFrame ?? false;
    this.baseVirtualAddress = BigInt(options.baseVirtualAddress ?? 0n);
    this.arch = options.arch ?? ARCHITECTURES.X86_64;

    this.entries = []; // Array of CIE and FDE entries
    this.cies = new Map(); // cieOffset -> CIE object
    this.fdes = []; // Array of FDE objects
    this.errors = [];
  }

  parse() {
    const reader = new BinaryReader(this.buffer);
    reader.baseVirtualAddress = this.baseVirtualAddress;

    while (reader.remaining >= 4) {
      const entryStartOffset = reader.offset;
      const initialLength = reader.readUint32();

      if (initialLength === 0) {
        // Terminator entry (end of .eh_frame table)
        this.entries.push({
          type: "TERMINATOR",
          startOffset: entryStartOffset,
          endOffset: reader.offset,
          length: 0
        });
        break;
      }

      let length = BigInt(initialLength);
      let is64BitDwarf = false;
      let headerLength = 4;

      if (initialLength === 0xFFFFFFFF) {
        if (reader.remaining < 8) {
          this.errors.push(`Truncated 64-bit DWARF length at offset ${entryStartOffset}`);
          break;
        }
        length = reader.readUint64();
        is64BitDwarf = true;
        headerLength = 12;
      }

      const recordDataLength = Number(length);
      const recordEndOffset = reader.offset + recordDataLength;

      // Strict boundary check against buffer size
      if (recordEndOffset > this.buffer.byteLength) {
        this.errors.push(
          `Record at offset ${entryStartOffset} length ${recordDataLength} exceeds buffer bounds (${this.buffer.byteLength})`
        );
        break;
      }

      const idOffset = reader.offset;
      const idOrPtr = is64BitDwarf ? reader.readUint64() : BigInt(reader.readUint32());

      // Determine CIE vs FDE:
      // In .eh_frame: CIE has id == 0.
      // In .debug_frame: CIE has id == 0xFFFFFFFF (or 0xFFFFFFFFFFFFFFFF).
      let isCie = false;
      if (this.isDebugFrame) {
        isCie = is64BitDwarf ? (idOrPtr === 0xFFFFFFFFFFFFFFFFn) : (idOrPtr === 0xFFFFFFFFn);
      } else {
        isCie = (idOrPtr === 0n);
      }

      if (isCie) {
        try {
          const cie = this.parseCIE(reader, entryStartOffset, recordEndOffset, is64BitDwarf, idOrPtr);
          this.entries.push(cie);
          this.cies.set(entryStartOffset, cie);
        } catch (err) {
          this.errors.push(`Error parsing CIE at 0x${entryStartOffset.toString(16)}: ${err.message}`);
          reader.seek(recordEndOffset);
        }
      } else {
        try {
          const fde = this.parseFDE(reader, entryStartOffset, recordEndOffset, is64BitDwarf, idOrPtr, idOffset);
          this.entries.push(fde);
          this.fdes.push(fde);
        } catch (err) {
          this.errors.push(`Error parsing FDE at 0x${entryStartOffset.toString(16)}: ${err.message}`);
          reader.seek(recordEndOffset);
        }
      }

      // Ensure reader is at exact record boundary
      reader.seek(recordEndOffset);
    }

    return {
      entries: this.entries,
      cies: Array.from(this.cies.values()),
      fdes: this.fdes,
      errors: this.errors
    };
  }

  parseCIE(reader, startOffset, endOffset, is64BitDwarf, cieId) {
    const version = reader.readUint8();
    const augmentation = reader.readNullTerminatedString();

    let addressSize = 8;
    let segmentSize = 0;
    if (version === 4) {
      addressSize = reader.readUint8();
      segmentSize = reader.readUint8();
    }

    const codeAlignmentFactor = reader.readULEB128();
    const dataAlignmentFactor = reader.readSLEB128();

    let returnAddressRegister = 0;
    if (version === 1) {
      returnAddressRegister = reader.readUint8();
    } else {
      returnAddressRegister = reader.readULEB128();
    }

    let augmentationData = null;
    let personalityEncoding = DW_EH_PE.omit;
    let personalityPointer = null;
    let lsdaEncoding = DW_EH_PE.omit;
    let fdeEncoding = DW_EH_PE.absptr;
    let isSignalFrame = false;
    let isBKeySigned = false;

    if (augmentation.startsWith("z")) {
      const augLength = reader.readULEB128();
      const augStart = reader.offset;
      const augEnd = augStart + Number(augLength);

      if (augEnd > endOffset) {
        throw new RangeError(`CIE augmentation data length ${augLength} exceeds record end`);
      }

      // Parse augmentation string characters
      for (let i = 1; i < augmentation.length; i++) {
        const char = augmentation[i];
        if (char === "P") {
          personalityEncoding = reader.readUint8();
          // Personality pointer (signed two's-complement pcrel if applicable)
          personalityPointer = reader.readEncodedPointer(personalityEncoding);
        } else if (char === "L") {
          lsdaEncoding = reader.readUint8();
        } else if (char === "R") {
          fdeEncoding = reader.readUint8();
        } else if (char === "S") {
          isSignalFrame = true;
        } else if (char === "B") {
          isBKeySigned = true;
        }
      }

      // Store raw augmentation bytes
      augmentationData = this.buffer.subarray(augStart, augEnd);
      reader.seek(augEnd);
    }

    // Remaining bytes are initial CFA instructions
    const instructionsOffset = reader.offset;
    const instructionsBytes = this.buffer.subarray(instructionsOffset, endOffset);
    const instructions = this.disassembleInstructions(instructionsBytes, {
      codeAlignmentFactor,
      dataAlignmentFactor,
      arch: this.arch,
      fdeEncoding
    });

    return {
      type: "CIE",
      startOffset,
      endOffset,
      length: endOffset - startOffset,
      is64BitDwarf,
      cieId,
      version,
      augmentation,
      addressSize,
      segmentSize,
      codeAlignmentFactor,
      dataAlignmentFactor,
      returnAddressRegister,
      returnAddressName: getRegisterName(returnAddressRegister, this.arch),
      personalityEncoding,
      personalityPointer,
      lsdaEncoding,
      fdeEncoding,
      fdeEncodingName: formatPointerEncoding(fdeEncoding),
      isSignalFrame,
      isBKeySigned,
      instructionsOffset,
      instructionsBytes,
      instructions
    };
  }

  parseFDE(reader, startOffset, endOffset, is64BitDwarf, idOrPtr, idOffset) {
    let governingCieOffset = 0;
    if (this.isDebugFrame) {
      governingCieOffset = Number(idOrPtr);
    } else {
      // In .eh_frame, CIE_pointer is byte offset backwards from idOffset:
      // cie_offset = idOffset - idOrPtr
      governingCieOffset = idOffset - Number(idOrPtr);
    }

    const cie = this.cies.get(governingCieOffset);
    if (!cie) {
      throw new Error(
        `FDE at 0x${startOffset.toString(16)} references unknown CIE offset 0x${governingCieOffset.toString(16)}`
      );
    }

    const fdeEnc = cie.fdeEncoding;

    // Initial location is encoded using CIE's fdeEncoding
    // TWO'S-COMPLEMENT SIGN EXTENSION: Handled inside readEncodedPointer
    const initLocRes = reader.readEncodedPointer(fdeEnc);
    const initialLocation = initLocRes.value;

    // Address range uses value format of fdeEncoding (no PC-relative modifier)
    const rangeEnc = fdeEnc & 0x0F;
    const rangeRes = reader.readEncodedPointer(rangeEnc);
    const addressRange = rangeRes.value;

    let augmentationData = null;
    let lsdaPointer = null;

    if (cie.augmentation.startsWith("z")) {
      const augLength = reader.readULEB128();
      const augStart = reader.offset;
      const augEnd = augStart + Number(augLength);

      if (augEnd > endOffset) {
        throw new RangeError(`FDE augmentation data length ${augLength} exceeds record end`);
      }

      // If CIE specified 'L', read LSDA pointer
      if (cie.augmentation.includes("L") && cie.lsdaEncoding !== DW_EH_PE.omit) {
        lsdaPointer = reader.readEncodedPointer(cie.lsdaEncoding);
      }

      augmentationData = this.buffer.subarray(augStart, augEnd);
      reader.seek(augEnd);
    }

    const instructionsOffset = reader.offset;
    const instructionsBytes = this.buffer.subarray(instructionsOffset, endOffset);
    const instructions = this.disassembleInstructions(instructionsBytes, {
      codeAlignmentFactor: cie.codeAlignmentFactor,
      dataAlignmentFactor: cie.dataAlignmentFactor,
      arch: this.arch,
      fdeEncoding: cie.fdeEncoding,
      initialLocation
    });

    return {
      type: "FDE",
      startOffset,
      endOffset,
      length: endOffset - startOffset,
      is64BitDwarf,
      ciePointer: idOrPtr,
      governingCieOffset,
      governingCie: cie,
      initialLocation,
      addressRange,
      endLocation: initialLocation + addressRange,
      lsdaPointer,
      instructionsOffset,
      instructionsBytes,
      instructions
    };
  }

  disassembleInstructions(bytes, context = {}) {
    const reader = new BinaryReader(bytes);
    const {
      codeAlignmentFactor = 1,
      dataAlignmentFactor = -8,
      arch = this.arch,
      fdeEncoding = DW_EH_PE.absptr,
      initialLocation = 0n
    } = context;

    const instructions = [];

    while (!reader.isEOF()) {
      const instStart = reader.offset;
      const opcodeByte = reader.readUint8();

      // Primary opcodes: top 2 bits
      const primary = opcodeByte & 0xC0;
      const operandLow = opcodeByte & 0x3F;

      if (primary === 0x40) { // DW_CFA_advance_loc
        const delta = operandLow * codeAlignmentFactor;
        instructions.push({
          offset: instStart,
          opcode: 0x40,
          name: "DW_CFA_advance_loc",
          rawBytes: bytes.subarray(instStart, reader.offset),
          operands: { delta, factor: codeAlignmentFactor },
          desc: `Advance PC by ${delta} (${operandLow} * ${codeAlignmentFactor})`
        });
      } else if (primary === 0x80) { // DW_CFA_offset
        const reg = operandLow;
        const regOffset = reader.readULEB128();
        const byteOffset = regOffset * dataAlignmentFactor;
        instructions.push({
          offset: instStart,
          opcode: 0x80,
          name: "DW_CFA_offset",
          rawBytes: bytes.subarray(instStart, reader.offset),
          operands: { reg, regOffset, byteOffset, regName: getRegisterName(reg, arch) },
          desc: `Save register ${getRegisterName(reg, arch)} at CFA + ${byteOffset}`
        });
      } else if (primary === 0xC0) { // DW_CFA_restore
        const reg = operandLow;
        instructions.push({
          offset: instStart,
          opcode: 0xC0,
          name: "DW_CFA_restore",
          rawBytes: bytes.subarray(instStart, reader.offset),
          operands: { reg, regName: getRegisterName(reg, arch) },
          desc: `Restore register ${getRegisterName(reg, arch)} to CIE initial rule`
        });
      } else {
        // Standard and extended opcodes
        switch (opcodeByte) {
          case 0x00: // DW_CFA_nop
            instructions.push({
              offset: instStart,
              opcode: 0x00,
              name: "DW_CFA_nop",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: {},
              desc: "No operation"
            });
            break;

          case 0x01: { // DW_CFA_set_loc
            const loc = reader.readEncodedPointer(fdeEncoding);
            instructions.push({
              offset: instStart,
              opcode: 0x01,
              name: "DW_CFA_set_loc",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { loc: loc.value },
              desc: `Set PC location to 0x${loc.value.toString(16)}`
            });
            break;
          }

          case 0x02: { // DW_CFA_advance_loc1
            const count = reader.readUint8();
            const delta = count * codeAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x02,
              name: "DW_CFA_advance_loc1",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { count, delta },
              desc: `Advance PC by ${delta} (${count} * ${codeAlignmentFactor})`
            });
            break;
          }

          case 0x03: { // DW_CFA_advance_loc2
            const count = reader.readUint16();
            const delta = count * codeAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x03,
              name: "DW_CFA_advance_loc2",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { count, delta },
              desc: `Advance PC by ${delta} (${count} * ${codeAlignmentFactor})`
            });
            break;
          }

          case 0x04: { // DW_CFA_advance_loc4
            const count = reader.readUint32();
            const delta = count * codeAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x04,
              name: "DW_CFA_advance_loc4",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { count, delta },
              desc: `Advance PC by ${delta} (${count} * ${codeAlignmentFactor})`
            });
            break;
          }

          case 0x05: { // DW_CFA_offset_extended
            const reg = reader.readULEB128();
            const regOffset = reader.readULEB128();
            const byteOffset = regOffset * dataAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x05,
              name: "DW_CFA_offset_extended",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, regOffset, byteOffset, regName: getRegisterName(reg, arch) },
              desc: `Save register ${getRegisterName(reg, arch)} at CFA + ${byteOffset}`
            });
            break;
          }

          case 0x06: { // DW_CFA_restore_extended
            const reg = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x06,
              name: "DW_CFA_restore_extended",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, regName: getRegisterName(reg, arch) },
              desc: `Restore register ${getRegisterName(reg, arch)} to CIE initial rule`
            });
            break;
          }

          case 0x07: { // DW_CFA_undefined
            const reg = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x07,
              name: "DW_CFA_undefined",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, regName: getRegisterName(reg, arch) },
              desc: `Set register ${getRegisterName(reg, arch)} rule to undefined`
            });
            break;
          }

          case 0x08: { // DW_CFA_same_value
            const reg = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x08,
              name: "DW_CFA_same_value",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, regName: getRegisterName(reg, arch) },
              desc: `Set register ${getRegisterName(reg, arch)} rule to same_value`
            });
            break;
          }

          case 0x09: { // DW_CFA_register
            const reg1 = reader.readULEB128();
            const reg2 = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x09,
              name: "DW_CFA_register",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: {
                reg1, reg2,
                reg1Name: getRegisterName(reg1, arch),
                reg2Name: getRegisterName(reg2, arch)
              },
              desc: `Save register ${getRegisterName(reg1, arch)} in ${getRegisterName(reg2, arch)}`
            });
            break;
          }

          case 0x0A: // DW_CFA_remember_state
            instructions.push({
              offset: instStart,
              opcode: 0x0A,
              name: "DW_CFA_remember_state",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: {},
              desc: "Push current CFA and register rules to state stack"
            });
            break;

          case 0x0B: // DW_CFA_restore_state
            instructions.push({
              offset: instStart,
              opcode: 0x0B,
              name: "DW_CFA_restore_state",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: {},
              desc: "Pop CFA and register rules from state stack"
            });
            break;

          case 0x0C: { // DW_CFA_def_cfa
            const reg = reader.readULEB128();
            const regOffset = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x0C,
              name: "DW_CFA_def_cfa",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, offset: regOffset, regName: getRegisterName(reg, arch) },
              desc: `Define CFA = ${getRegisterName(reg, arch)} + ${regOffset}`
            });
            break;
          }

          case 0x0D: { // DW_CFA_def_cfa_register
            const reg = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x0D,
              name: "DW_CFA_def_cfa_register",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, regName: getRegisterName(reg, arch) },
              desc: `Define CFA register = ${getRegisterName(reg, arch)}`
            });
            break;
          }

          case 0x0E: { // DW_CFA_def_cfa_offset
            const regOffset = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x0E,
              name: "DW_CFA_def_cfa_offset",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { offset: regOffset },
              desc: `Define CFA offset = ${regOffset}`
            });
            break;
          }

          case 0x0F: { // DW_CFA_def_cfa_expression
            const exprLen = reader.readULEB128();
            const exprBytes = reader.readBytes(Number(exprLen));
            instructions.push({
              offset: instStart,
              opcode: 0x0F,
              name: "DW_CFA_def_cfa_expression",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { exprLen, exprBytes },
              desc: `Define CFA by DWARF expression (${exprLen} bytes)`
            });
            break;
          }

          case 0x10: { // DW_CFA_expression
            const reg = reader.readULEB128();
            const exprLen = reader.readULEB128();
            const exprBytes = reader.readBytes(Number(exprLen));
            instructions.push({
              offset: instStart,
              opcode: 0x10,
              name: "DW_CFA_expression",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, exprLen, exprBytes, regName: getRegisterName(reg, arch) },
              desc: `Save register ${getRegisterName(reg, arch)} by DWARF expression`
            });
            break;
          }

          case 0x11: { // DW_CFA_offset_extended_sf
            const reg = reader.readULEB128();
            const regOffset = reader.readSLEB128();
            const byteOffset = regOffset * dataAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x11,
              name: "DW_CFA_offset_extended_sf",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, regOffset, byteOffset, regName: getRegisterName(reg, arch) },
              desc: `Save register ${getRegisterName(reg, arch)} at CFA + ${byteOffset}`
            });
            break;
          }

          case 0x12: { // DW_CFA_def_cfa_sf
            const reg = reader.readULEB128();
            const regOffset = reader.readSLEB128();
            const byteOffset = regOffset * dataAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x12,
              name: "DW_CFA_def_cfa_sf",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, offset: byteOffset, regName: getRegisterName(reg, arch) },
              desc: `Define CFA = ${getRegisterName(reg, arch)} + ${byteOffset}`
            });
            break;
          }

          case 0x13: { // DW_CFA_def_cfa_offset_sf
            const regOffset = reader.readSLEB128();
            const byteOffset = regOffset * dataAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x13,
              name: "DW_CFA_def_cfa_offset_sf",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { offset: byteOffset },
              desc: `Define CFA offset = ${byteOffset}`
            });
            break;
          }

          case 0x14: { // DW_CFA_val_offset
            const reg = reader.readULEB128();
            const regOffset = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x14,
              name: "DW_CFA_val_offset",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, offset: regOffset, regName: getRegisterName(reg, arch) },
              desc: `Set register ${getRegisterName(reg, arch)} value = CFA + ${regOffset}`
            });
            break;
          }

          case 0x15: { // DW_CFA_val_offset_sf
            const reg = reader.readULEB128();
            const regOffset = reader.readSLEB128();
            const byteOffset = regOffset * dataAlignmentFactor;
            instructions.push({
              offset: instStart,
              opcode: 0x15,
              name: "DW_CFA_val_offset_sf",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, offset: byteOffset, regName: getRegisterName(reg, arch) },
              desc: `Set register ${getRegisterName(reg, arch)} value = CFA + ${byteOffset}`
            });
            break;
          }

          case 0x2D: // DW_CFA_GNU_window_save
            instructions.push({
              offset: instStart,
              opcode: 0x2D,
              name: "DW_CFA_GNU_window_save",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: {},
              desc: "SPARC window save"
            });
            break;

          case 0x2E: { // DW_CFA_GNU_args_size
            const size = reader.readULEB128();
            instructions.push({
              offset: instStart,
              opcode: 0x2E,
              name: "DW_CFA_GNU_args_size",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { size },
              desc: `Total argument size on stack = ${size}`
            });
            break;
          }

          case 0x2F: { // DW_CFA_GNU_negative_offset_extended
            const reg = reader.readULEB128();
            const regOffset = reader.readULEB128();
            const byteOffset = -(regOffset * dataAlignmentFactor);
            instructions.push({
              offset: instStart,
              opcode: 0x2F,
              name: "DW_CFA_GNU_negative_offset_extended",
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: { reg, offset: byteOffset, regName: getRegisterName(reg, arch) },
              desc: `Save register ${getRegisterName(reg, arch)} at CFA - ${regOffset * dataAlignmentFactor}`
            });
            break;
          }

          default:
            instructions.push({
              offset: instStart,
              opcode: opcodeByte,
              name: `DW_CFA_unknown_0x${opcodeByte.toString(16)}`,
              rawBytes: bytes.subarray(instStart, reader.offset),
              operands: {},
              desc: `Unknown CFA opcode 0x${opcodeByte.toString(16)}`
            });
            break;
        }
      }
    }

    return instructions;
  }
}
