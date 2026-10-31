// arch_registers.js - DWARF Register Number mappings for target ABIs

export const ARCHITECTURES = {
  X86_64: "x86_64",
  AARCH64: "aarch64",
  I386: "i386"
};

const X86_64_REGISTERS = {
  0: "rax",
  1: "rdx",
  2: "rcx",
  3: "rbx",
  4: "rsi",
  5: "rdi",
  6: "rbp",
  7: "rsp",
  8: "r8",
  9: "r9",
  10: "r10",
  11: "r11",
  12: "r12",
  13: "r13",
  14: "r14",
  15: "r15",
  16: "rip", // Return Address
  17: "xmm0",
  18: "xmm1",
  19: "xmm2",
  20: "xmm3",
  21: "xmm4",
  22: "xmm5",
  23: "xmm6",
  24: "xmm7",
  25: "xmm8",
  26: "xmm9",
  27: "xmm10",
  28: "xmm11",
  29: "xmm12",
  30: "xmm13",
  31: "xmm14",
  32: "xmm15",
  49: "rflags",
  64: "fs_base",
  65: "gs_base"
};

const AARCH64_REGISTERS = {
  0: "x0",
  1: "x1",
  2: "x2",
  3: "x3",
  4: "x4",
  5: "x5",
  6: "x6",
  7: "x7",
  8: "x8",
  9: "x9",
  10: "x10",
  11: "x11",
  12: "x12",
  13: "x13",
  14: "x14",
  15: "x15",
  16: "x16",
  17: "x17",
  18: "x18",
  19: "x19",
  20: "x20",
  21: "x21",
  22: "x22",
  23: "x23",
  24: "x24",
  25: "x25",
  26: "x26",
  27: "x27",
  28: "x28",
  29: "x29 (fp)",
  30: "x30 (lr)",
  31: "sp",
  32: "pc",
  64: "v0",
  65: "v1",
  66: "v2",
  67: "v3",
  68: "v4",
  69: "v5",
  70: "v6",
  71: "v7"
};

const I386_REGISTERS = {
  0: "eax",
  1: "ecx",
  2: "edx",
  3: "ebx",
  4: "esp",
  5: "ebp",
  6: "esi",
  7: "edi",
  8: "eip"
};

/**
 * Returns register name for given DWARF register number and architecture
 * @param {number} regNum
 * @param {string} [arch="x86_64"]
 * @returns {string}
 */
export function getRegisterName(regNum, arch = ARCHITECTURES.X86_64) {
  let map = X86_64_REGISTERS;
  if (arch === ARCHITECTURES.AARCH64) map = AARCH64_REGISTERS;
  if (arch === ARCHITECTURES.I386) map = I386_REGISTERS;

  if (regNum in map) {
    return map[regNum];
  }
  return `r${regNum}`;
}

/**
 * Returns default return address register number for architecture
 * @param {string} [arch="x86_64"]
 * @returns {number}
 */
export function getDefaultReturnAddressRegister(arch = ARCHITECTURES.X86_64) {
  switch (arch) {
    case ARCHITECTURES.AARCH64:
      return 30; // x30 (LR)
    case ARCHITECTURES.I386:
      return 8;  // eip
    case ARCHITECTURES.X86_64:
    default:
      return 16; // rip
  }
}

/**
 * Returns canonical stack pointer register number for architecture
 * @param {string} [arch="x86_64"]
 * @returns {number}
 */
export function getStackPointerRegister(arch = ARCHITECTURES.X86_64) {
  switch (arch) {
    case ARCHITECTURES.AARCH64:
      return 31; // sp
    case ARCHITECTURES.I386:
      return 4;  // esp
    case ARCHITECTURES.X86_64:
    default:
      return 7;  // rsp
  }
}
