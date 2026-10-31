// app.js - Main client-side application controller

import { ElfParser } from "./elf_parser.js";
import { DwarfParser } from "./dwarf_parser.js";
import { CfaStateMachine } from "./state_machine.js";
import { SAMPLES, hexToBytes } from "./samples.js";
import { ARCHITECTURES } from "./arch_registers.js";
import { UIRenderer } from "./ui.js";

export class DwarfVisualizerApp {
  constructor() {
    this.currentBuffer = null;
    this.currentFileName = "";
    this.isElf = false;
    this.elfParser = null;
    this.elfHeader = null;
    this.sections = [];
    this.dwarfData = null;
    this.selectedRecord = null;
    this.selectedArch = ARCHITECTURES.X86_64;

    this.ui = new UIRenderer(this);
    this.initEventListeners();
  }

  initEventListeners() {
    // 1. View Tab Switching
    const viewTabs = document.querySelectorAll(".view-tab");
    viewTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        viewTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const targetViewId = tab.getAttribute("data-tab");
        document.querySelectorAll(".view-panel").forEach(panel => {
          panel.classList.remove("active");
        });
        const targetPanel = document.getElementById(targetViewId);
        if (targetPanel) targetPanel.classList.add("active");
      });
    });

    // 2. Input Mode Switching (File Dropzone vs Hex Input)
    const inputTabs = document.querySelectorAll(".input-tab");
    inputTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        inputTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const targetInput = tab.getAttribute("data-input-mode");
        const dropzoneContainer = document.getElementById("dropzone-container");
        const hexContainer = document.getElementById("hex-input-container");

        if (targetInput === "file") {
          dropzoneContainer.style.display = "flex";
          hexContainer.style.display = "none";
        } else {
          dropzoneContainer.style.display = "none";
          hexContainer.style.display = "flex";
        }
      });
    });

    // 3. Architecture Selector
    const archSelect = document.getElementById("arch-select");
    if (archSelect) {
      archSelect.addEventListener("change", (e) => {
        this.selectedArch = e.target.value;
        if (this.currentBuffer) {
          this.reparseDwarf();
        }
      });
    }

    // 4. Sample Preset Dropdown
    const sampleSelect = document.getElementById("sample-select");
    if (sampleSelect) {
      sampleSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val && SAMPLES[val]) {
          this.loadSample(val);
        }
      });
    }

    // 5. Preset Quick Chips
    const chips = document.querySelectorAll(".chip[data-sample]");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const sampleKey = chip.getAttribute("data-sample");
        if (SAMPLES[sampleKey]) {
          this.loadSample(sampleKey);
          if (sampleSelect) sampleSelect.value = sampleKey;
        }
      });
    });

    // 6. Drag and Drop File Zone
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFile(e.target.files[0]);
        }
      });
    }

    // 7. Hex Input Controls
    const btnDecodeHex = document.getElementById("btn-decode-hex");
    const btnFormatHex = document.getElementById("btn-format-hex");
    const btnClearHex = document.getElementById("btn-clear-hex");
    const hexTextarea = document.getElementById("hex-textarea");

    if (btnDecodeHex && hexTextarea) {
      btnDecodeHex.addEventListener("click", () => {
        const hex = hexTextarea.value.trim();
        if (!hex) {
          this.ui.showAlert("Please enter hex bytecode to decode.");
          return;
        }
        try {
          const bytes = hexToBytes(hex);
          this.loadBuffer(bytes, "Pasted Hex Bytecode");
        } catch (err) {
          this.ui.showAlert(`Hex decode error: ${err.message}`);
        }
      });
    }

    if (btnFormatHex && hexTextarea) {
      btnFormatHex.addEventListener("click", () => {
        try {
          const bytes = hexToBytes(hexTextarea.value);
          const chunks = [];
          for (let i = 0; i < bytes.length; i += 16) {
            const line = Array.from(bytes.subarray(i, Math.min(i + 16, bytes.length)))
              .map(b => b.toString(16).padStart(2, "0"))
              .join(" ");
            chunks.push(line);
          }
          hexTextarea.value = chunks.join("\n");
        } catch (err) {
          this.ui.showAlert(`Hex format error: ${err.message}`);
        }
      });
    }

    if (btnClearHex && hexTextarea) {
      btnClearHex.addEventListener("click", () => {
        hexTextarea.value = "";
      });
    }

    // 8. Search records filter
    const recordSearch = document.getElementById("record-search");
    if (recordSearch) {
      recordSearch.addEventListener("input", () => {
        if (this.dwarfData) {
          this.ui.renderRecordsExplorer(this.dwarfData);
        }
      });
    }

    // 9. Export Buttons
    const btnExportJson = document.getElementById("btn-export-json");
    const btnExportCsv = document.getElementById("btn-export-csv");
    const btnExportAscii = document.getElementById("btn-export-ascii");
    const btnCopyDisasm = document.getElementById("btn-copy-disasm");

    if (btnExportJson) btnExportJson.addEventListener("click", () => this.exportJson());
    if (btnExportCsv) btnExportCsv.addEventListener("click", () => this.exportCsv());
    if (btnExportAscii) btnExportAscii.addEventListener("click", () => this.exportAsciiTable());
    if (btnCopyDisasm) btnCopyDisasm.addEventListener("click", () => this.copyDisassembly());
  }

  handleFile(file) {
    this.ui.clearAlert();
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const bytes = new Uint8Array(arrayBuffer);
      this.loadBuffer(bytes, file.name);
    };
    reader.onerror = () => {
      this.ui.showAlert(`Failed to read file: ${file.name}`);
    };
    reader.readAsArrayBuffer(file);
  }

  loadSample(sampleKey) {
    this.ui.clearAlert();
    const sample = SAMPLES[sampleKey];
    if (!sample) return;

    let bytes = null;
    if (sample.buildBinary) {
      bytes = sample.buildBinary();
    } else if (sample.hex) {
      bytes = hexToBytes(sample.hex);
      const hexTextarea = document.getElementById("hex-textarea");
      if (hexTextarea) {
        // Pretty-format hex into 16-byte lines
        const lines = [];
        for (let i = 0; i < bytes.length; i += 16) {
          lines.push(Array.from(bytes.subarray(i, Math.min(i + 16, bytes.length)))
            .map(b => b.toString(16).padStart(2, "0"))
            .join(" "));
        }
        hexTextarea.value = lines.join("\n");
      }
    }

    if (sample.arch) {
      this.selectedArch = sample.arch;
      const archSelect = document.getElementById("arch-select");
      if (archSelect) archSelect.value = sample.arch;
    }

    this.loadBuffer(bytes, sample.name);
  }

  loadBuffer(buffer, name = "") {
    this.ui.clearAlert();
    this.currentBuffer = buffer;
    this.currentFileName = name;

    const fileLabel = document.getElementById("file-info-label");
    if (fileLabel) {
      fileLabel.textContent = `${name} (${buffer.byteLength.toLocaleString()} bytes)`;
    }

    // 1. Detect if buffer is an ELF / PRX binary
    if (ElfParser.isElfBinary(buffer)) {
      this.isElf = true;
      try {
        this.elfParser = new ElfParser(buffer);
        this.elfHeader = this.elfParser.parse();
        this.sections = this.elfParser.sections;

        if (this.elfHeader.arch) {
          this.selectedArch = this.elfHeader.arch;
          const archSelect = document.getElementById("arch-select");
          if (archSelect) archSelect.value = this.elfHeader.arch;
        }

        // Locate .eh_frame
        const ehFrameInfo = this.elfParser.getEhFrame();
        if (ehFrameInfo) {
          this.parseDwarfData(ehFrameInfo.buffer, ehFrameInfo.virtualAddress);
        } else {
          // Fallback: try raw buffer
          this.parseDwarfData(buffer, 0n);
        }
      } catch (err) {
        this.ui.showAlert(`ELF parse warning: ${err.message}. Attempting raw DWARF scan.`);
        this.parseDwarfData(buffer, 0n);
      }
    } else {
      this.isElf = false;
      this.elfParser = null;
      this.elfHeader = null;
      this.sections = [];
      this.parseDwarfData(buffer, 0n);
    }

    this.refreshViews();
  }

  parseDwarfData(buffer, baseVirtualAddress = 0n) {
    try {
      const dwarfParser = new DwarfParser(buffer, {
        baseVirtualAddress,
        arch: this.selectedArch
      });
      this.dwarfData = dwarfParser.parse();

      if (this.dwarfData.errors && this.dwarfData.errors.length > 0) {
        this.ui.showAlert(this.dwarfData.errors.join("; "), "danger");
      }

      // Default select the first record
      if (this.dwarfData.entries.length > 0) {
        this.selectedRecord = this.dwarfData.entries[0];
      } else {
        this.selectedRecord = null;
      }
    } catch (err) {
      this.ui.showAlert(`DWARF CFI parse error: ${err.message}`);
      this.dwarfData = null;
      this.selectedRecord = null;
    }
  }

  reparseDwarf() {
    if (!this.currentBuffer) return;
    if (this.isElf && this.elfParser) {
      const ehFrame = this.elfParser.getEhFrame();
      if (ehFrame) {
        this.parseDwarfData(ehFrame.buffer, ehFrame.virtualAddress);
      } else {
        this.parseDwarfData(this.currentBuffer, 0n);
      }
    } else {
      this.parseDwarfData(this.currentBuffer, 0n);
    }
    this.refreshViews();
  }

  selectRecord(record) {
    this.selectedRecord = record;
    this.ui.renderRecordDetail(record);
    this.ui.renderUnwindMatrix(record);
    this.ui.renderDisassembly(record);
    this.ui.renderLandingPads(record);

    if (record) {
      this.ui.renderHexInspector(this.currentBuffer, {
        start: record.startOffset,
        end: record.endOffset
      });
    }

    // Re-highlight item in records explorer list
    const items = document.querySelectorAll(".record-item");
    items.forEach(item => item.classList.remove("selected"));
    const selectedItem = document.querySelector(`.record-item[data-offset="0x${record.startOffset.toString(16)}"]`);
    if (selectedItem) selectedItem.classList.add("selected");
  }

  refreshViews() {
    this.ui.renderTelemetry({
      isElf: this.isElf,
      elfHeader: this.elfHeader,
      dwarfData: this.dwarfData
    });

    this.ui.renderRecordsExplorer(this.dwarfData);
    this.ui.renderRecordDetail(this.selectedRecord);
    this.ui.renderUnwindMatrix(this.selectedRecord);
    this.ui.renderDisassembly(this.selectedRecord);
    this.ui.renderLandingPads(this.selectedRecord);
    this.ui.renderElfHeaders(this.elfHeader, this.sections);

    const highlightRange = this.selectedRecord
      ? { start: this.selectedRecord.startOffset, end: this.selectedRecord.endOffset }
      : null;
    this.ui.renderHexInspector(this.currentBuffer, highlightRange);
  }

  exportJson() {
    if (!this.dwarfData) {
      this.ui.showAlert("No DWARF records to export.");
      return;
    }

    // Clean cyclic references for JSON
    const exportable = {
      format: this.isElf ? "ELF" : "RAW_CFI",
      header: this.elfHeader,
      cies: this.dwarfData.cies.map(c => ({
        offset: c.startOffset,
        length: c.length,
        version: c.version,
        augmentation: c.augmentation,
        codeAlignmentFactor: c.codeAlignmentFactor,
        dataAlignmentFactor: c.dataAlignmentFactor,
        returnAddressRegister: c.returnAddressRegister,
        fdeEncoding: c.fdeEncodingName,
        instructions: c.instructions.map(i => ({ offset: i.offset, name: i.name, desc: i.desc }))
      })),
      fdes: this.dwarfData.fdes.map(f => ({
        offset: f.startOffset,
        length: f.length,
        initialLocation: `0x${f.initialLocation.toString(16)}`,
        addressRange: `0x${f.addressRange.toString(16)}`,
        endLocation: `0x${f.endLocation.toString(16)}`,
        governingCieOffset: f.governingCieOffset,
        lsdaPointer: f.lsdaPointer ? `0x${f.lsdaPointer.value.toString(16)}` : null,
        instructions: f.instructions.map(i => ({ offset: i.offset, name: i.name, desc: i.desc }))
      }))
    };

    const blob = new Blob([JSON.stringify(exportable, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2)], {
      type: "application/json"
    });
    this.downloadBlob(blob, `dwarf_cfi_${Date.now()}.json`);
  }

  exportCsv() {
    if (!this.selectedRecord) {
      this.ui.showAlert("Select an FDE to export its unwind table as CSV.");
      return;
    }

    const cie = this.selectedRecord.type === "CIE" ? this.selectedRecord : this.selectedRecord.governingCie;
    const fde = this.selectedRecord.type === "FDE" ? this.selectedRecord : null;

    const sm = new CfaStateMachine(cie, fde, this.selectedArch);
    const matrix = sm.generateMatrix();

    const headers = ["PC Address", "Relative Offset", "CFA Rule", ...matrix.columnNames.map(c => c.name)];
    const lines = [headers.join(",")];

    for (const row of matrix.rows) {
      const regValues = matrix.columns.map(reg => {
        const info = row.registers[reg];
        return info ? `"${info.formatted}"` : `"u"`;
      });
      lines.push([row.formattedLoc, row.formattedRel, `"${row.formattedCfa}"`, ...regValues].join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    this.downloadBlob(blob, `unwind_table_${rowHex(this.selectedRecord.startOffset)}.csv`);
  }

  exportAsciiTable() {
    if (!this.selectedRecord) {
      this.ui.showAlert("Select an FDE to export its readelf-style ASCII table.");
      return;
    }

    const cie = this.selectedRecord.type === "CIE" ? this.selectedRecord : this.selectedRecord.governingCie;
    const fde = this.selectedRecord.type === "FDE" ? this.selectedRecord : null;

    const sm = new CfaStateMachine(cie, fde, this.selectedArch);
    const matrix = sm.generateMatrix();

    let output = `readelf -wF Style DWARF Unwind Table\n`;
    output += `Record: ${this.selectedRecord.type} @ 0x${this.selectedRecord.startOffset.toString(16)}\n`;
    if (fde) {
      output += `Code Range: 0x${fde.initialLocation.toString(16)} .. 0x${fde.endLocation.toString(16)}\n`;
    }
    output += `\n`;

    const colWidths = [18, 12, 14, ...matrix.columnNames.map(c => Math.max(8, c.name.length + 2))];
    const headerRow = ["LOC", "OFFSET", "CFA", ...matrix.columnNames.map(c => c.name)];

    output += headerRow.map((h, i) => h.padEnd(colWidths[i])).join(" | ") + "\n";
    output += colWidths.map(w => "-".repeat(w)).join("-|-") + "\n";

    for (const row of matrix.rows) {
      const regCells = matrix.columns.map(reg => {
        const info = row.registers[reg];
        return info ? info.formatted : "u";
      });
      const cells = [row.formattedLoc, row.formattedRel, row.formattedCfa, ...regCells];
      output += cells.map((c, i) => c.padEnd(colWidths[i])).join(" | ") + "\n";
    }

    const blob = new Blob([output], { type: "text/plain" });
    this.downloadBlob(blob, `readelf_unwind_${Date.now()}.txt`);
  }

  copyDisassembly() {
    if (!this.selectedRecord || !this.selectedRecord.instructions) {
      this.ui.showAlert("No CFI instructions to copy.");
      return;
    }

    const text = this.selectedRecord.instructions.map(inst => {
      const rawHex = Array.from(inst.rawBytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
      return `+0x${inst.offset.toString(16).padStart(2, "0")}\t[${rawHex}]\t${inst.name}\t${inst.desc}`;
    }).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      this.ui.showAlert("CFI Disassembly copied to clipboard!", "success");
    }).catch(() => {
      this.ui.showAlert("Failed to access clipboard.");
    });
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function rowHex(n) {
  return "0x" + n.toString(16);
}

// Auto bootstrap when loaded in browser
window.addEventListener("DOMContentLoaded", () => {
  const app = new DwarfVisualizerApp();
  // Automatically load Sample 1 on start
  app.loadSample("SAMPLE_1_STANDARD_X86_64");
  window.dwarfApp = app;
});
