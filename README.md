# DWARF CFI Visualizer

[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://slopgobblercobbler.github.io/dwarf-cfi-visualizer/)
[![Tests](https://img.shields.io/badge/tests-22%2F22%20passing-success?style=for-the-badge)](https://github.com/slopgobblercobbler/dwarf-cfi-visualizer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An interactive, production-grade, 100% client-side web application for inspecting and visualizing DWARF Call Frame Information (CFI), `.eh_frame` and `.debug_frame` sections, CFA state machine unwinding rules, and C++ exception landing pads (`.gcc_except_table`).

Hosted live at: **[https://slopgobblercobbler.github.io/dwarf-cfi-visualizer/](https://slopgobblercobbler.github.io/dwarf-cfi-visualizer/)**

---

## Key Features

- **100% Client-Side Execution**: Zero backend dependencies. Runs entirely in modern browsers with standard Web APIs and Web Workers.
- **Drag-and-Drop ELF / PRX Parsing**: Drag-and-drop ELF64, ELF32, or PlayStation Orbis / Prospero PRX binaries to automatically locate and extract `.eh_frame`, `.eh_frame_hdr`, and `.gcc_except_table` sections.
- **Raw Hex Bytecode Input**: Paste raw DWARF bytecode directly (accepts raw hex, C-style arrays `0x14, 0x00...`, space-separated strings, or comments) with one-click decoding and formatting.
- **Full DWARF CFA State Machine**: Simulates stack unwinding rule evolution step-by-step and renders an interactive **Unwind Matrix** (`readelf -wF` / `llvm-dwarfdump` style table).
- **CFI Opcode Disassembler**: Deconstructs every DWARF CFI instruction (`DW_CFA_advance_loc`, `DW_CFA_def_cfa`, `DW_CFA_offset`, `DW_CFA_remember_state`, `DW_CFA_restore_state`, `DW_CFA_val_offset`, `DW_CFA_GNU_*`, etc.) with raw hex byte representation, operand resolution, and human-readable descriptions.
- **C++ Exception & Landing Pad Map**: Decodes LSDA (`.gcc_except_table`), mapping protected call-site address ranges to landing pads and personality routines (`__gxx_personality_v0`).
- **Signed Two's-Complement Displacement Engine**: Fully compliant with PR #5773 and #11991 audit directives, ensuring negative PC-relative displacements in `DW_EH_PE_pcrel | DW_EH_PE_sdata4` are properly sign-extended to 64 bits without unsigned upper-half wrapping.
- **Multi-Architecture Support**: Native DWARF register naming and ABI mappings for **x86-64 (AMD64 / System V)**, **AArch64 (ARM 64-bit)**, and **i386**.
- **Interactive Synchronized Hex Inspector**: 16-byte hex dump synchronized with the record explorer. Clicking any CIE, FDE, or opcode highlights and scrolls to the exact byte range in real time.
- **Export Capabilities**:
  - Export Unwind Table as **CSV**
  - Export Decoded Records as **JSON**
  - Export standard **readelf -wF ASCII Table**
  - One-click copy disassembly to clipboard

---

## Built-In Sample Presets

Test the visualizer immediately with one click using the built-in sample library:

| Sample | Name | Description |
|---|---|---|
| **Sample 1** | Standard x86-64 Frame | Canonical prologue (`push %rbp; mov %rsp, %rbp`) with `zR` CIE, frame pointer setup, and epilogue |
| **Sample 2** | C++ Exception (LSDA) | `zPLR` CIE referencing `__gxx_personality_v0` and FDE with LSDA exception landing pads |
| **Sample 3** | State Stack (push/pop) | Evaluates `DW_CFA_remember_state` and `DW_CFA_restore_state` branch unwinding and `def_cfa_offset` |
| **Sample 4** | Signed 2's-Complement | Negative PC-relative displacement (-4096 / `0xFFFFF000`), verifying sign extension safety |
| **Sample 5** | Synthetic ELF64 Binary | Valid 64-bit ELF binary image with standard ELF Header, Section Header Table, and `.eh_frame` |

---

## Architecture

The project is structured into modular, standards-compliant ES modules with zero bundler dependencies:

```
dwarf-cfi-visualizer/
├── index.html                   # Semantic HTML5 single-page application
├── css/
│   └── style.css                # Dark-mode developer aesthetic styling
├── js/
│   ├── app.js                   # Application bootstrap and export controller
│   ├── arch_registers.js        # DWARF register mappings for x86-64, AArch64, i386
│   ├── binary_reader.js         # Bounds-checked binary reader (ULEB128, SLEB128, DWARF ptrs)
│   ├── dwarf_parser.js          # DWARF CIE/FDE parser & CFI instruction disassembler
│   ├── elf_parser.js            # ELF64 / ELF32 / PRX binary header and section reader
│   ├── lsda_parser.js           # C++ exception handling (.gcc_except_table) parser
│   ├── samples.js               # Embedded test vectors and synthetic ELF64 generator
│   ├── state_machine.js         # CFA State Machine & Unwind Matrix table generator
│   └── ui.js                    # Reactive DOM rendering and event routing
├── test/
│   ├── binary_reader.test.js    # ULEB128/SLEB128 and bounds verification
│   ├── dwarf_parser.test.js     # CIE/FDE decoding and opcode tests
│   ├── elf_parser.test.js       # ELF header and section table tests
│   ├── extended_cfi.test.js     # Architecture mappings, advanced opcodes, hex parsing
│   ├── lsda_parser.test.js      # Call-site table and landing pad tests
│   ├── signed_displacement.test.js # Two's-complement displacement sign extension tests
│   └── state_machine.test.js    # Unwind matrix and state stack tests
├── .github/
│   └── workflows/
│       └── deploy-pages.yml     # Automated test & GitHub Pages deployment workflow
├── package.json                 # Project manifest with npm test script
├── LICENSE                      # MIT License
└── README.md
```

---

## Technical Deep-Dive: Two's-Complement Displacements

In DWARF Call Frame Information, PC-relative displacements in `DW_EH_PE_pcrel | DW_EH_PE_sdata4` (0x1B) represent signed 32-bit offsets relative to the virtual address of the field:

$$\text{Target Virtual Address} = \text{Base Virtual Address} + \text{int64\_t}(\text{int32\_t}(\text{displacement}))$$

If an unwinding implementation improperly zero-extends the 32-bit field on a 64-bit platform:

$$\text{Incorrect Address} = \text{Base Virtual Address} + \text{uint64\_t}(\text{uint32\_t}(\text{displacement}))$$

A negative displacement of `-4096` (`0xFFFFF000`) becomes `+4294963200`, causing stack unwinding to seek non-existent landing pads or jump tables outside the address space, leading to crash or abnormal termination during C++ `throw`.

This tool implements strict sign-extension in `BinaryReader.readEncodedPointer()`:

```javascript
const signedDisp = isSigned ? BigInt.asIntN(64, rawValue) : rawValue;
calculatedValue = BigInt.asUintN(64, base + signedDisp);
```

---

## Local Development & Testing

Run the automated test suite locally:

```bash
# Clone the repository
git clone https://github.com/slopgobblercobbler/dwarf-cfi-visualizer.git
cd dwarf-cfi-visualizer

# Run unit tests (Node.js 20+ built-in test runner)
npm test
```

To run the web application locally, open `index.html` in any modern web browser or start a local HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

---

## License

This project is licensed under the [MIT License](LICENSE).


## DWARF Exception Landing Pad Preservation

Details DWARF CFI table reconstruction and exception landing pad alignment verification in AnyPS5 relinker.

## Update 2026-11-06T20:39:21Z
- Enhanced DWARF CFI unwind record visualizer performance and precision.
