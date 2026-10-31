// samples.js - Built-in sample DWARF CFI records and ELF binary datasets

export const SAMPLES = {
  SAMPLE_1_STANDARD_X86_64: {
    id: "sample_1",
    name: "Standard x86-64 Function Frame (push %rbp; mov %rsp, %rbp)",
    description: "Canonical x86-64 CIE ('zR') and FDE showing stack frame setup with frame pointer and return address.",
    arch: "x86_64",
    hex: [
      // CIE (length = 20):
      "14000000",         // length = 20
      "00000000",         // CIE ID = 0
      "01",               // Version = 1
      "7a5200",           // Augmentation = "zR\0"
      "01",               // Code alignment factor = 1
      "78",               // Data alignment factor = -8 (SLEB128)
      "10",               // Return address register = 16 (rip)
      "01",               // Augmentation length = 1
      "1b",               // FDE encoding = 0x1B (DW_EH_PE_pcrel | DW_EH_PE_sdata4)
      "0c0708",           // DW_CFA_def_cfa: reg=7(rsp), offset=8
      "9001",             // DW_CFA_offset: reg=16(rip), offset=1 (-8 bytes)
      "0000",             // padding (2 bytes -> total 20 bytes)

      // FDE (length = 36):
      "24000000",         // length = 36
      "1c000000",         // CIE offset backwards = 28 bytes
      "00100000",         // initial_location = 0x1000 relative
      "45000000",         // address_range = 0x45 (69 bytes)
      "00",               // Augmentation length = 0
      "41",               // DW_CFA_advance_loc(1) -> push %rbp
      "0e10",             // DW_CFA_def_cfa_offset(16) -> CFA = rsp + 16
      "8602",             // DW_CFA_offset: reg=6(rbp) at CFA - 16
      "43",               // DW_CFA_advance_loc(3) -> mov %rsp, %rbp
      "0d06",             // DW_CFA_def_cfa_register(6) -> CFA = rbp + 16
      "54",               // DW_CFA_advance_loc(20) -> function body
      "c6",               // DW_CFA_restore: reg=6(rbp)
      "0c0708",           // DW_CFA_def_cfa: reg=7(rsp), offset=8
      "00000000000000000000", // padding (10 bytes -> total 36 bytes)

      // Terminator:
      "00000000"
    ].join("")
  },

  SAMPLE_2_CPP_EXCEPTION_LSDA: {
    id: "sample_2",
    name: "C++ Exception Frame (Personality __gxx_personality_v0 + LSDA)",
    description: "CIE with 'zPLR' augmentations containing C++ runtime personality pointer and FDE referencing LSDA exception landing pads.",
    arch: "x86_64",
    hex: [
      // CIE (length = 32):
      "20000000",         // length = 32
      "00000000",         // CIE ID = 0
      "01",               // Version = 1
      "7a504c5200",       // Augmentation = "zPLR\0"
      "01",               // Code alignment factor = 1
      "78",               // Data alignment factor = -8 (SLEB128)
      "10",               // Return address reg = 16 (rip)
      "07",               // Augmentation length = 7 bytes
      "1b",               // Personality encoding = 0x1B (pcrel | sdata4)
      "00200000",         // Personality pointer displacement (+0x2000)
      "1b",               // LSDA encoding = 0x1B (pcrel | sdata4)
      "1b",               // FDE encoding = 0x1B (pcrel | sdata4)
      "0c0708",           // DW_CFA_def_cfa: rsp + 8
      "9001",             // DW_CFA_offset: rip at CFA - 8
      "000000000000",     // padding (6 bytes -> total 32 bytes)

      // FDE (length = 40):
      "28000000",         // length = 40
      "28000000",         // CIE pointer backwards = 40 bytes
      "00400000",         // initial_location = 0x4000
      "80000000",         // address_range = 0x80 (128 bytes)
      "04",               // Augmentation data length = 4 bytes (contains LSDA ptr)
      "80100000",         // LSDA pointer displacement = +0x1080
      "41",               // DW_CFA_advance_loc(1)
      "0e10",             // DW_CFA_def_cfa_offset(16)
      "8602",             // DW_CFA_offset: rbp at CFA - 16
      "42",               // DW_CFA_advance_loc(2)
      "0d06",             // DW_CFA_def_cfa_register: rbp
      "48",               // DW_CFA_advance_loc(8)
      "8303",             // DW_CFA_offset: rbx at CFA - 24
      "8c04",             // DW_CFA_offset: r12 at CFA - 32
      "00000000000000000000", // padding (10 bytes -> total 40 bytes)

      // Terminator:
      "00000000"
    ].join("")
  },

  SAMPLE_3_REMEMBER_RESTORE_STATE: {
    id: "sample_3",
    name: "Complex CFA State Machine (remember_state & restore_state)",
    description: "Evaluates DWARF CFA branch unwinding, def_cfa_sf, and state stack push/pop.",
    arch: "x86_64",
    hex: [
      // CIE (length = 20):
      "14000000",         // length = 20
      "00000000",         // CIE ID = 0
      "03",               // Version = 3
      "7a5200",           // Augmentation = "zR\0"
      "01",               // Code alignment factor = 1
      "78",               // Data alignment factor = -8
      "10",               // Return address reg = 16 (ULEB128)
      "01",               // Augmentation length = 1
      "1b",               // FDE encoding = 0x1B
      "0c0708",           // DW_CFA_def_cfa: rsp + 8
      "9001",             // DW_CFA_offset: rip at CFA - 8
      "0000",             // padding (2 bytes -> total 20 bytes)

      // FDE (length = 40):
      "28000000",         // length = 40
      "1c000000",         // CIE pointer backwards = 28 bytes
      "00800000",         // initial_location = 0x8000
      "60000000",         // address_range = 0x60
      "00",               // Aug length = 0
      "41",               // DW_CFA_advance_loc(1)
      "0e18",             // DW_CFA_def_cfa_offset(24)
      "8303",             // DW_CFA_offset: rbx at CFA - 24
      "42",               // DW_CFA_advance_loc(2)
      "0a",               // DW_CFA_remember_state -> push to state stack
      "0e30",             // DW_CFA_def_cfa_offset(48) -> stack expanded in branch
      "8f05",             // DW_CFA_offset: r15 at CFA - 40
      "44",               // DW_CFA_advance_loc(4)
      "0b",               // DW_CFA_restore_state -> pop previous state!
      "42",               // DW_CFA_advance_loc(2)
      "c3",               // DW_CFA_restore: rbx
      "0e08",             // DW_CFA_def_cfa_offset(8)
      "0000000000000000000000000000", // padding (14 bytes -> total 40 bytes)

      // Terminator:
      "00000000"
    ].join("")
  },

  SAMPLE_4_SIGNED_TWOS_COMPLEMENT: {
    id: "sample_4",
    name: "Two's-Complement Signed PC-Rel Displacements (Negative Target)",
    description: "Verifies signed 32-bit two's-complement arithmetic on negative PC-relative displacements (PR #5773, #11991).",
    arch: "x86_64",
    hex: [
      // CIE (length = 20):
      "14000000",         // length = 20
      "00000000",         // CIE ID = 0
      "01",               // Version = 1
      "7a5200",           // Augmentation = "zR\0"
      "01",               // Code alignment factor = 1
      "78",               // Data alignment factor = -8
      "10",               // Return address reg = 16
      "01",               // Augmentation length = 1
      "1b",               // FDE encoding = 0x1B (pcrel | sdata4)
      "0c0708",           // DW_CFA_def_cfa: rsp + 8
      "9001",             // DW_CFA_offset: rip at CFA - 8
      "0000",             // padding (2 bytes -> total 20 bytes)

      // FDE with negative displacement 0xFFFFF000 (-4096) (length = 32):
      "20000000",         // length = 32
      "1c000000",         // CIE offset backwards = 28 bytes
      "00f0ffff",         // initial_location = -4096 (0xFFFFF000 little-endian)
      "50000000",         // address_range = 0x50
      "00",               // aug length = 0
      "42",               // DW_CFA_advance_loc(2)
      "0e10",             // DW_CFA_def_cfa_offset(16)
      "8602",             // DW_CFA_offset: rbp at CFA - 16
      "0000000000000000000000000000", // padding (14 bytes -> total 32 bytes)

      // Terminator:
      "00000000"
    ].join("")
  },

  SAMPLE_5_SYNTHETIC_ELF64: {
    id: "sample_5",
    name: "Complete ELF64 Binary with .eh_frame & .eh_frame_hdr",
    description: "Full synthetic 64-bit ELF binary image with standard ELF Header, Section Header Table, and .eh_frame section.",
    arch: "x86_64",
    buildBinary: createSyntheticElf64Binary
  }
};

/**
 * Creates a synthetic valid ELF64 binary containing .eh_frame, .text, and .shstrtab sections.
 * @returns {Uint8Array}
 */
export function createSyntheticElf64Binary() {
  // Section Layout:
  // Offset 0x000: ELF Header (64 bytes)
  // Offset 0x040: .text section (32 bytes)
  // Offset 0x060: .eh_frame section (68 bytes)
  // Offset 0x0B0: .shstrtab section (32 bytes)
  // Offset 0x0E0: Section Header Table (4 entries * 64 bytes = 256 bytes)
  // Total size = 0x0E0 + 0x100 = 480 bytes (0x1E0)

  const totalSize = 0x1E0;
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);

  // 1. ELF Header (64 bytes)
  buffer[0] = 0x7F; buffer[1] = 0x45; buffer[2] = 0x4C; buffer[3] = 0x46; // \x7fELF
  buffer[4] = 2; // ELFCLASS64
  buffer[5] = 1; // ELFDATA2LSB (little endian)
  buffer[6] = 1; // EV_CURRENT
  buffer[7] = 0; // ELFOSABI_NONE / System V
  buffer[8] = 0; // ABI Version

  view.setUint16(0x10, 2, true);      // e_type = ET_EXEC
  view.setUint16(0x12, 62, true);     // e_machine = EM_X86_64 (62)
  view.setUint32(0x14, 1, true);      // e_version = 1
  view.setBigUint64(0x18, 0x401000n, true); // e_entry = 0x401000
  view.setBigUint64(0x20, 0n, true);  // e_phoff = 0
  view.setBigUint64(0x28, 0x0E0n, true); // e_shoff = 0x0E0
  view.setUint32(0x30, 0, true);      // e_flags = 0
  view.setUint16(0x34, 64, true);     // e_ehsize = 64
  view.setUint16(0x36, 0, true);      // e_phentsize = 0
  view.setUint16(0x38, 0, true);      // e_phnum = 0
  view.setUint16(0x3A, 64, true);     // e_shentsize = 64
  view.setUint16(0x3C, 4, true);      // e_shnum = 4 (.null, .text, .eh_frame, .shstrtab)
  view.setUint16(0x3E, 3, true);      // e_shstrndx = 3 (.shstrtab)

  // 2. .text section at 0x40 (dummy opcodes: push %rbp, mov %rsp, %rbp, ret)
  const textOffset = 0x40;
  buffer[textOffset + 0] = 0x55; // push %rbp
  buffer[textOffset + 1] = 0x48; buffer[textOffset + 2] = 0x89; buffer[textOffset + 3] = 0xE5; // mov %rsp, %rbp
  buffer[textOffset + 4] = 0x5D; // pop %rbp
  buffer[textOffset + 5] = 0xC3; // ret

  // 3. .eh_frame section at 0x60
  const ehFrameOffset = 0x60;
  const sample1Bytes = hexToBytes(SAMPLES.SAMPLE_1_STANDARD_X86_64.hex);
  buffer.set(sample1Bytes, ehFrameOffset);
  const ehFrameSize = sample1Bytes.byteLength;

  // 4. .shstrtab section at 0x0B0
  const shstrtabOffset = 0x0B0;
  const strings = "\0.text\0.eh_frame\0.shstrtab\0";
  const encoder = new TextEncoder();
  const strBytes = encoder.encode(strings);
  buffer.set(strBytes, shstrtabOffset);

  const textNameOffset = 1;
  const ehFrameNameOffset = textNameOffset + ".text".length + 1; // 7
  const shstrtabNameOffset = ehFrameNameOffset + ".eh_frame".length + 1; // 17

  // 5. Section Header Table at 0x0E0 (4 entries * 64 bytes)
  const shTableOffset = 0x0E0;

  // Section 0: SHT_NULL (all zeros)

  // Section 1: .text
  const sec1 = shTableOffset + 64;
  view.setUint32(sec1 + 0x00, textNameOffset, true); // sh_name
  view.setUint32(sec1 + 0x04, 1, true);              // sh_type = SHT_PROGBITS
  view.setBigUint64(sec1 + 0x08, 0x06n, true);       // sh_flags = SHF_ALLOC | SHF_EXECINSTR
  view.setBigUint64(sec1 + 0x10, 0x401000n, true);   // sh_addr
  view.setBigUint64(sec1 + 0x18, BigInt(textOffset), true); // sh_offset
  view.setBigUint64(sec1 + 0x20, 32n, true);         // sh_size
  view.setBigUint64(sec1 + 0x30, 16n, true);         // sh_addralign

  // Section 2: .eh_frame
  const sec2 = shTableOffset + 128;
  view.setUint32(sec2 + 0x00, ehFrameNameOffset, true); // sh_name
  view.setUint32(sec2 + 0x04, 1, true);                 // sh_type = SHT_PROGBITS
  view.setBigUint64(sec2 + 0x08, 0x02n, true);          // sh_flags = SHF_ALLOC
  view.setBigUint64(sec2 + 0x10, 0x402000n, true);      // sh_addr
  view.setBigUint64(sec2 + 0x18, BigInt(ehFrameOffset), true); // sh_offset
  view.setBigUint64(sec2 + 0x20, BigInt(ehFrameSize), true);   // sh_size
  view.setBigUint64(sec2 + 0x30, 8n, true);             // sh_addralign

  // Section 3: .shstrtab
  const sec3 = shTableOffset + 192;
  view.setUint32(sec3 + 0x00, shstrtabNameOffset, true); // sh_name
  view.setUint32(sec3 + 0x04, 3, true);                  // sh_type = SHT_STRTAB
  view.setBigUint64(sec3 + 0x08, 0n, true);              // sh_flags = 0
  view.setBigUint64(sec3 + 0x10, 0n, true);              // sh_addr = 0
  view.setBigUint64(sec3 + 0x18, BigInt(shstrtabOffset), true); // sh_offset
  view.setBigUint64(sec3 + 0x20, BigInt(strBytes.byteLength), true); // sh_size
  view.setBigUint64(sec3 + 0x30, 1n, true);              // sh_addralign

  return buffer;
}

export function hexToBytes(hexString) {
  const cleanHex = hexString
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // remove comments
    .replace(/0[xX]/g, "")                  // remove 0x prefixes
    .replace(/[^0-9a-fA-F]/g, "");          // keep only hex characters
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length: must have an even number of hex characters");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}
