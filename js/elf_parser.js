// elf_parser.js - Bounds-checked ELF64 / ELF32 / PRX binary and section parser

import { BinaryReader } from "./binary_reader.js";
import { ARCHITECTURES } from "./arch_registers.js";

export const ELF_MAGIC = [0x7F, 0x45, 0x4C, 0x46]; // \x7fELF

export const ELF_CLASSES = {
  1: "32-bit (ELF32)",
  2: "64-bit (ELF64)"
};

export const ELF_DATA_ENDIAN = {
  1: "Little-Endian (ELFDATA2LSB)",
  2: "Big-Endian (ELFDATA2MSB)"
};

export const ELF_TYPES = {
  0: "ET_NONE (None)",
  1: "ET_REL (Relocatable object)",
  2: "ET_EXEC (Executable)",
  3: "ET_DYN (Shared object / PRX)",
  4: "ET_CORE (Core dump)"
};

export const ELF_MACHINES = {
  3: { name: "x86 (Intel 80386)", arch: ARCHITECTURES.I386 },
  40: { name: "ARM", arch: ARCHITECTURES.AARCH64 },
  62: { name: "AMD x86-64", arch: ARCHITECTURES.X86_64 },
  183: { name: "AArch64 (ARM 64-bit)", arch: ARCHITECTURES.AARCH64 }
};

export const SECTION_TYPES = {
  0: "SHT_NULL",
  1: "SHT_PROGBITS",
  2: "SHT_SYMTAB",
  3: "SHT_STRTAB",
  4: "SHT_RELA",
  5: "SHT_HASH",
  6: "SHT_DYNAMIC",
  7: "SHT_NOTE",
  8: "SHT_NOBITS",
  9: "SHT_REL",
  10: "SHT_SHLIB",
  11: "SHT_DYNSYM",
  0x70000001: "SHT_X86_64_UNWIND"
};

export const PROGRAM_TYPES = {
  0: "PT_NULL",
  1: "PT_LOAD",
  2: "PT_DYNAMIC",
  3: "PT_INTERP",
  4: "PT_NOTE",
  5: "PT_SHLIB",
  6: "PT_PHDR",
  7: "PT_TLS",
  0x6474e550: "PT_GNU_EH_FRAME",
  0x6474e551: "PT_GNU_STACK",
  0x6474e552: "PT_GNU_RELRO",
  0x61000000: "PT_SCE_RELA",
  0x61000001: "PT_SCE_PROGLIB"
};

export class ElfParser {
  /**
   * @param {Uint8Array|ArrayBuffer} buffer
   */
  constructor(buffer) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.reader = new BinaryReader(this.buffer);
    this.isElf = false;
    this.header = null;
    this.sections = [];
    this.programHeaders = [];
    this.shstrtab = null;
  }

  /**
   * Checks if the binary has ELF magic
   * @returns {boolean}
   */
  static isElfBinary(buffer) {
    if (!buffer || buffer.byteLength < 4) return false;
    const view = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return view[0] === ELF_MAGIC[0] &&
           view[1] === ELF_MAGIC[1] &&
           view[2] === ELF_MAGIC[2] &&
           view[3] === ELF_MAGIC[3];
  }

  parse() {
    if (!ElfParser.isElfBinary(this.buffer)) {
      throw new Error("Invalid binary: Missing ELF magic header (0x7F 'ELF')");
    }
    this.isElf = true;

    // e_ident
    const magic = [
      this.reader.readUint8(),
      this.reader.readUint8(),
      this.reader.readUint8(),
      this.reader.readUint8()
    ];
    const eiClass = this.reader.readUint8(); // 1 = 32-bit, 2 = 64-bit
    const eiData = this.reader.readUint8();  // 1 = Little Endian, 2 = Big Endian
    const eiVersion = this.reader.readUint8();
    const eiOsAbi = this.reader.readUint8();
    const eiAbiVersion = this.reader.readUint8();

    // Skip remainder of e_ident (7 bytes)
    this.reader.skip(7);

    const is64Bit = eiClass === 2;
    const isLittleEndian = eiData === 1;
    this.reader.littleEndian = isLittleEndian;

    const eType = this.reader.readUint16();
    const eMachine = this.reader.readUint16();
    const eVersion = this.reader.readUint32();

    const eEntry = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
    const ePhoff = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
    const eShoff = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());

    const eFlags = this.reader.readUint32();
    const eEhsize = this.reader.readUint16();
    const ePhentsize = this.reader.readUint16();
    const ePhnum = this.reader.readUint16();
    const eShentsize = this.reader.readUint16();
    const eShnum = this.reader.readUint16();
    const eShstrndx = this.reader.readUint16();

    const machineInfo = ELF_MACHINES[eMachine] || { name: `Unknown (${eMachine})`, arch: ARCHITECTURES.X86_64 };

    this.header = {
      is64Bit,
      isLittleEndian,
      eiClass,
      eiClassName: ELF_CLASSES[eiClass] || `Unknown (${eiClass})`,
      eiData,
      eiDataName: ELF_DATA_ENDIAN[eiData] || `Unknown (${eiData})`,
      eiVersion,
      eiOsAbi,
      eiAbiVersion,
      eType,
      eTypeName: ELF_TYPES[eType] || `Unknown (${eType})`,
      eMachine,
      eMachineName: machineInfo.name,
      arch: machineInfo.arch,
      eVersion,
      eEntry,
      ePhoff: Number(ePhoff),
      eShoff: Number(eShoff),
      eFlags,
      eEhsize,
      ePhentsize,
      ePhnum,
      eShentsize,
      eShnum,
      eShstrndx
    };

    // Parse Section Headers
    if (this.header.eShoff > 0 && this.header.eShnum > 0) {
      this.parseSectionHeaders();
    }

    // Parse Program Headers
    if (this.header.ePhoff > 0 && this.header.ePhnum > 0) {
      this.parseProgramHeaders();
    }

    return this.header;
  }

  parseSectionHeaders() {
    const { eShoff, eShentsize, eShnum, eShstrndx, is64Bit } = this.header;

    // Bounds check section header table
    const tableSpan = eShnum * eShentsize;
    if (eShoff + tableSpan > this.buffer.byteLength) {
      throw new RangeError(
        `Section header table exceeds buffer: offset ${eShoff} + ${tableSpan} > ${this.buffer.byteLength}`
      );
    }

    const rawSections = [];
    for (let i = 0; i < eShnum; i++) {
      const entryOffset = eShoff + (i * eShentsize);
      this.reader.seek(entryOffset);

      const shNameOffset = this.reader.readUint32();
      const shType = this.reader.readUint32();
      const shFlags = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
      const shAddr = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
      const shOffset = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
      const shSize = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
      const shLink = this.reader.readUint32();
      const shInfo = this.reader.readUint32();
      const shAddralign = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());
      const shEntsize = is64Bit ? this.reader.readUint64() : BigInt(this.reader.readUint32());

      rawSections.push({
        index: i,
        nameOffset: shNameOffset,
        name: "",
        type: shType,
        typeName: SECTION_TYPES[shType] || `0x${shType.toString(16)}`,
        flags: shFlags,
        addr: shAddr,
        offset: Number(shOffset),
        size: Number(shSize),
        link: shLink,
        info: shInfo,
        addralign: shAddralign,
        entsize: shEntsize
      });
    }

    // Resolve section names via shstrtab
    if (eShstrndx < rawSections.length) {
      const strtabSec = rawSections[eShstrndx];
      if (strtabSec.offset + strtabSec.size <= this.buffer.byteLength) {
        this.shstrtab = this.buffer.subarray(strtabSec.offset, strtabSec.offset + strtabSec.size);
        for (const sec of rawSections) {
          if (sec.nameOffset < this.shstrtab.byteLength) {
            let end = sec.nameOffset;
            while (end < this.shstrtab.byteLength && this.shstrtab[end] !== 0) {
              end++;
            }
            sec.name = new TextDecoder().decode(this.shstrtab.subarray(sec.nameOffset, end));
          }
        }
      }
    }

    this.sections = rawSections;
  }

  parseProgramHeaders() {
    const { ePhoff, ePhentsize, ePhnum, is64Bit } = this.header;
    const tableSpan = ePhnum * ePhentsize;
    if (ePhoff + tableSpan > this.buffer.byteLength) {
      return; // Non-fatal if damaged program headers
    }

    for (let i = 0; i < ePhnum; i++) {
      const entryOffset = ePhoff + (i * ePhentsize);
      this.reader.seek(entryOffset);

      const pType = this.reader.readUint32();
      let pFlags = 0;
      let pOffset = 0n;
      let pVaddr = 0n;
      let pPaddr = 0n;
      let pFilesz = 0n;
      let pMemsz = 0n;
      let pAlign = 0n;

      if (is64Bit) {
        pFlags = this.reader.readUint32();
        pOffset = this.reader.readUint64();
        pVaddr = this.reader.readUint64();
        pPaddr = this.reader.readUint64();
        pFilesz = this.reader.readUint64();
        pMemsz = this.reader.readUint64();
        pAlign = this.reader.readUint64();
      } else {
        pOffset = BigInt(this.reader.readUint32());
        pVaddr = BigInt(this.reader.readUint32());
        pPaddr = BigInt(this.reader.readUint32());
        pFilesz = BigInt(this.reader.readUint32());
        pMemsz = BigInt(this.reader.readUint32());
        pFlags = this.reader.readUint32();
        pAlign = BigInt(this.reader.readUint32());
      }

      this.programHeaders.push({
        index: i,
        type: pType,
        typeName: PROGRAM_TYPES[pType] || `0x${pType.toString(16)}`,
        flags: pFlags,
        offset: Number(pOffset),
        vaddr: pVaddr,
        paddr: pPaddr,
        filesz: Number(pFilesz),
        memsz: Number(pMemsz),
        align: pAlign
      });
    }
  }

  /**
   * Finds a section by name
   * @param {string} name
   * @returns {object|null}
   */
  findSection(name) {
    return this.sections.find(s => s.name === name) || null;
  }

  /**
   * Retrieves data buffer for a section
   * @param {string|object} section
   * @returns {Uint8Array|null}
   */
  getSectionData(section) {
    const sec = typeof section === "string" ? this.findSection(section) : section;
    if (!sec) return null;
    if (sec.offset + sec.size > this.buffer.byteLength) {
      throw new RangeError(`Section ${sec.name} data out of binary bounds`);
    }
    return this.buffer.subarray(sec.offset, sec.offset + sec.size);
  }

  /**
   * Extracts .eh_frame or returns null if absent
   * @returns {{ buffer: Uint8Array, virtualAddress: bigint, section: object }|null}
   */
  getEhFrame() {
    const sec = this.findSection(".eh_frame");
    if (!sec) return null;
    const data = this.getSectionData(sec);
    return {
      buffer: data,
      virtualAddress: sec.addr,
      section: sec
    };
  }

  /**
   * Extracts .debug_frame if present
   */
  getDebugFrame() {
    const sec = this.findSection(".debug_frame");
    if (!sec) return null;
    return {
      buffer: this.getSectionData(sec),
      virtualAddress: sec.addr,
      section: sec
    };
  }

  /**
   * Extracts .gcc_except_table (LSDA) if present
   */
  getGccExceptTable() {
    const sec = this.findSection(".gcc_except_table");
    if (!sec) return null;
    return {
      buffer: this.getSectionData(sec),
      virtualAddress: sec.addr,
      section: sec
    };
  }
}
