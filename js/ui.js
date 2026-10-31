// ui.js - Interactive UI controller, DOM rendering, and event handlers

import { formatPointerEncoding } from "./dwarf_parser.js";
import { CfaStateMachine } from "./state_machine.js";
import { LsdaParser } from "./lsda_parser.js";

export class UIRenderer {
  constructor(app) {
    this.app = app;
    this.elements = {};
    this.bindElements();
  }

  bindElements() {
    this.elements.statsFormat = document.getElementById("stats-format");
    this.elements.statsCieCount = document.getElementById("stats-cie-count");
    this.elements.statsFdeCount = document.getElementById("stats-fde-count");
    this.elements.statsAudit = document.getElementById("stats-audit");

    this.elements.recordsList = document.getElementById("records-list");
    this.elements.recordDetail = document.getElementById("record-detail");
    this.elements.matrixWrapper = document.getElementById("matrix-wrapper");
    this.elements.disasmList = document.getElementById("disasm-list");
    this.elements.landingPadContainer = document.getElementById("landing-pad-container");
    this.elements.elfHeaderContainer = document.getElementById("elf-header-container");
    this.elements.hexInspector = document.getElementById("hex-inspector");
    this.elements.alertContainer = document.getElementById("alert-container");

    this.elements.recordSearch = document.getElementById("record-search");
    this.elements.fdeSelectMatrix = document.getElementById("fde-select-matrix");
  }

  showAlert(message, type = "danger") {
    if (!this.elements.alertContainer) return;
    this.elements.alertContainer.innerHTML = `
      <div class="alert-box alert-${type}">
        <span>${escapeHtml(message)}</span>
      </div>
    `;
    this.elements.alertContainer.style.display = "block";
  }

  clearAlert() {
    if (!this.elements.alertContainer) return;
    this.elements.alertContainer.innerHTML = "";
    this.elements.alertContainer.style.display = "none";
  }

  renderTelemetry(data) {
    const { isElf, elfHeader, dwarfData } = data;
    if (isElf && elfHeader) {
      this.elements.statsFormat.textContent = `${elfHeader.eiClassName} ${elfHeader.eTypeName}`;
    } else {
      this.elements.statsFormat.textContent = "Raw .eh_frame slice";
    }

    const cieCount = dwarfData ? dwarfData.cies.length : 0;
    const fdeCount = dwarfData ? dwarfData.fdes.length : 0;

    this.elements.statsCieCount.textContent = cieCount;
    this.elements.statsFdeCount.textContent = fdeCount;

    const hasErrors = dwarfData && dwarfData.errors && dwarfData.errors.length > 0;
    if (hasErrors) {
      this.elements.statsAudit.textContent = `${dwarfData.errors.length} Warning(s)`;
      this.elements.statsAudit.className = "stat-value";
      this.elements.statsAudit.style.color = "var(--accent-orange)";
    } else {
      this.elements.statsAudit.textContent = "PASS (Bounds Clean)";
      this.elements.statsAudit.className = "stat-value ok";
    }
  }

  renderRecordsExplorer(dwarfData, selectedIndex = 0) {
    if (!dwarfData || !dwarfData.entries) {
      this.elements.recordsList.innerHTML = "<p class='text-muted'>No DWARF records parsed.</p>";
      return;
    }

    const searchTerm = (this.elements.recordSearch?.value || "").toLowerCase();

    const filtered = dwarfData.entries.filter((entry, idx) => {
      if (entry.type === "TERMINATOR") return false;
      if (!searchTerm) return true;
      const text = `${entry.type} 0x${entry.startOffset.toString(16)} ${entry.initialLocation !== undefined ? '0x' + entry.initialLocation.toString(16) : ''}`.toLowerCase();
      return text.includes(searchTerm);
    });

    if (filtered.length === 0) {
      this.elements.recordsList.innerHTML = "<p style='color: var(--text-muted); padding: 8px;'>No matching records.</p>";
      return;
    }

    this.elements.recordsList.innerHTML = filtered.map((entry, idx) => {
      const isSelected = (this.app.selectedRecord === entry);
      const isCie = entry.type === "CIE";
      const badgeClass = isCie ? "type-cie" : "type-fde";
      const title = isCie ? `CIE (Aug: "${entry.augmentation || ''}")` : `FDE (PC: 0x${entry.initialLocation.toString(16)})`;
      const subtitle = isCie
        ? `RetReg: ${entry.returnAddressName} | Factor: (${entry.codeAlignmentFactor}, ${entry.dataAlignmentFactor})`
        : `Span: +0x${entry.addressRange.toString(16)} | CIE @ 0x${entry.governingCieOffset.toString(16)}`;

      return `
        <div class="record-item ${isSelected ? 'selected' : ''}" data-index="${idx}">
          <div class="record-item-top">
            <span class="record-type-badge ${badgeClass}">${entry.type}</span>
            <span class="record-offset">0x${entry.startOffset.toString(16)} - 0x${entry.endOffset.toString(16)}</span>
          </div>
          <div class="record-details">
            <strong style="color: var(--text-primary); font-size: 0.8rem;">${escapeHtml(title)}</strong>
            <span>${escapeHtml(subtitle)}</span>
          </div>
        </div>
      `;
    }).join("");

    // Bind click events
    const items = this.elements.recordsList.querySelectorAll(".record-item");
    items.forEach((item, idx) => {
      item.addEventListener("click", () => {
        this.app.selectRecord(filtered[idx]);
      });
    });

    // Populate FDE dropdown in Matrix tab
    if (this.elements.fdeSelectMatrix && dwarfData.fdes) {
      this.elements.fdeSelectMatrix.innerHTML = dwarfData.fdes.map((f, i) => {
        return `<option value="${i}">FDE #${i + 1} (PC: 0x${f.initialLocation.toString(16)} - 0x${f.endLocation.toString(16)})</option>`;
      }).join("");

      this.elements.fdeSelectMatrix.onchange = (e) => {
        const fde = dwarfData.fdes[parseInt(e.target.value, 10)];
        if (fde) this.app.selectRecord(fde);
      };
    }
  }

  renderRecordDetail(entry) {
    if (!entry) {
      this.elements.recordDetail.innerHTML = "<p style='color: var(--text-muted);'>Select a record to inspect properties.</p>";
      return;
    }

    const isCie = entry.type === "CIE";
    const headerTitle = isCie ? `Common Information Entry (CIE)` : `Frame Description Entry (FDE)`;

    let propsHtml = "";
    if (isCie) {
      propsHtml = `
        <div class="prop-card"><div class="prop-key">Record Type</div><div class="prop-val type-cie" style="display:inline-block; padding: 2px 6px; border-radius: 4px;">CIE</div></div>
        <div class="prop-card"><div class="prop-key">Offset in Section</div><div class="prop-val">0x${entry.startOffset.toString(16)} (${entry.length} bytes)</div></div>
        <div class="prop-card"><div class="prop-key">DWARF Version</div><div class="prop-val">${entry.version}</div></div>
        <div class="prop-card"><div class="prop-key">Augmentation String</div><div class="prop-val">"${entry.augmentation}"</div></div>
        <div class="prop-card"><div class="prop-key">Code Alignment Factor</div><div class="prop-val">${entry.codeAlignmentFactor}</div></div>
        <div class="prop-card"><div class="prop-key">Data Alignment Factor</div><div class="prop-val">${entry.dataAlignmentFactor}</div></div>
        <div class="prop-card"><div class="prop-key">Return Address Register</div><div class="prop-val">${entry.returnAddressRegister} (${entry.returnAddressName})</div></div>
        <div class="prop-card"><div class="prop-key">FDE Pointer Encoding</div><div class="prop-val">${entry.fdeEncodingName} (0x${entry.fdeEncoding.toString(16)})</div></div>
        <div class="prop-card"><div class="prop-key">Personality Encoding</div><div class="prop-val">${entry.personalityEncoding !== 0xFF ? formatPointerEncoding(entry.personalityEncoding) : 'None (DW_EH_PE_omit)'}</div></div>
        <div class="prop-card"><div class="prop-key">LSDA Encoding</div><div class="prop-val">${entry.lsdaEncoding !== 0xFF ? formatPointerEncoding(entry.lsdaEncoding) : 'None (DW_EH_PE_omit)'}</div></div>
      `;
    } else {
      propsHtml = `
        <div class="prop-card"><div class="prop-key">Record Type</div><div class="prop-val type-fde" style="display:inline-block; padding: 2px 6px; border-radius: 4px;">FDE</div></div>
        <div class="prop-card"><div class="prop-key">Offset in Section</div><div class="prop-val">0x${entry.startOffset.toString(16)} (${entry.length} bytes)</div></div>
        <div class="prop-card"><div class="prop-key">Initial Location (PC)</div><div class="prop-val" style="color: var(--accent-blue);">0x${entry.initialLocation.toString(16)}</div></div>
        <div class="prop-card"><div class="prop-key">Address Range Span</div><div class="prop-val">0x${entry.addressRange.toString(16)} (${Number(entry.addressRange)} bytes)</div></div>
        <div class="prop-card"><div class="prop-key">Function End PC</div><div class="prop-val">0x${entry.endLocation.toString(16)}</div></div>
        <div class="prop-card"><div class="prop-key">Governing CIE Offset</div><div class="prop-val">0x${entry.governingCieOffset.toString(16)}</div></div>
        <div class="prop-card"><div class="prop-key">LSDA Exception Pointer</div><div class="prop-val" style="color: ${entry.lsdaPointer ? 'var(--accent-red)' : 'var(--text-muted)'};">${entry.lsdaPointer ? '0x' + entry.lsdaPointer.value.toString(16) : 'None'}</div></div>
        <div class="prop-card"><div class="prop-key">CFI Instructions Count</div><div class="prop-val">${entry.instructions ? entry.instructions.length : 0} opcodes</div></div>
      `;
    }

    this.elements.recordDetail.innerHTML = `
      <div class="detail-section">
        <div class="detail-title">
          <span>${headerTitle}</span>
          <span class="badge">0x${entry.startOffset.toString(16)} - 0x${entry.endOffset.toString(16)}</span>
        </div>
        <div class="prop-grid">
          ${propsHtml}
        </div>
      </div>
    `;
  }

  renderUnwindMatrix(entry) {
    if (!entry) {
      this.elements.matrixWrapper.innerHTML = "<p style='color: var(--text-muted); padding: 20px;'>Select an FDE to generate CFA unwind matrix.</p>";
      return;
    }

    const cie = entry.type === "CIE" ? entry : entry.governingCie;
    const fde = entry.type === "FDE" ? entry : null;

    const sm = new CfaStateMachine(cie, fde, this.app.selectedArch);
    const matrix = sm.generateMatrix();

    if (matrix.rows.length === 0) {
      this.elements.matrixWrapper.innerHTML = "<p style='color: var(--text-muted); padding: 20px;'>No unwind rows generated.</p>";
      return;
    }

    const headerColsHtml = matrix.columnNames.map(c => `<th>${escapeHtml(c.name)}</th>`).join("");

    const rowsHtml = matrix.rows.map(row => {
      const regCells = matrix.columns.map(reg => {
        const regInfo = row.registers[reg];
        const text = regInfo ? regInfo.formatted : "u";
        let cellClass = "reg-undefined";
        if (text === "s") cellClass = "reg-same";
        else if (text.startsWith("cfa") || text.startsWith("[cfa")) cellClass = "reg-saved";
        return `<td class="${cellClass}">${escapeHtml(text)}</td>`;
      }).join("");

      return `
        <tr>
          <td style="color: var(--accent-blue); font-weight: 700;">${row.formattedLoc}</td>
          <td style="color: var(--text-muted);">${row.formattedRel}</td>
          <td class="cfa-col">${escapeHtml(row.formattedCfa)}</td>
          ${regCells}
        </tr>
      `;
    }).join("");

    this.elements.matrixWrapper.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>PC Address</th>
            <th>Offset</th>
            <th>CFA Rule</th>
            ${headerColsHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  renderDisassembly(entry) {
    if (!entry || !entry.instructions) {
      this.elements.disasmList.innerHTML = "<p style='color: var(--text-muted);'>No CFI instructions found in record.</p>";
      return;
    }

    this.elements.disasmList.innerHTML = entry.instructions.map((inst, i) => {
      const rawHex = Array.from(inst.rawBytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
      return `
        <div class="disasm-row" data-inst-idx="${i}">
          <span class="disasm-offset">+0x${inst.offset.toString(16).padStart(2, "0")}</span>
          <span class="disasm-bytes">${rawHex}</span>
          <span class="disasm-opcode">${escapeHtml(inst.name)}</span>
          <span class="disasm-desc">${escapeHtml(inst.desc)}</span>
        </div>
      `;
    }).join("");
  }

  renderLandingPads(entry) {
    if (!entry || entry.type !== "FDE" || !entry.lsdaPointer) {
      this.elements.landingPadContainer.innerHTML = `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            The selected record does not contain an LSDA pointer. Select a C++ Exception FDE (e.g. <strong>Sample 2</strong>) to inspect Exception Landing Pads.
          </p>
        </div>
      `;
      return;
    }

    // Check if we have LSDA data
    let lsdaData = null;
    if (this.app.isElf && this.app.elfParser) {
      lsdaData = this.app.elfParser.getGccExceptTable()?.buffer;
    }

    // If no standalone section, try reading from relative offset in current buffer
    if (!lsdaData && entry.lsdaPointer) {
      const targetOffset = Number(entry.lsdaPointer.value);
      if (targetOffset >= 0 && targetOffset < this.app.currentBuffer.byteLength) {
        lsdaData = this.app.currentBuffer.subarray(targetOffset);
      }
    }

    if (!lsdaData) {
      this.elements.landingPadContainer.innerHTML = `
        <div class="callsite-card has-landing-pad">
          <div class="callsite-header">
            <span>LSDA Pointer Referenced: <strong>0x${entry.lsdaPointer.value.toString(16)}</strong></span>
            <span class="landing-pad-badge lp-present">External .gcc_except_table</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px;">
            The FDE specifies an LSDA pointer targeting address 0x${entry.lsdaPointer.value.toString(16)}.
            In full ELF binaries, this points directly to the C++ personality action table and landing pad dispatch vector.
          </p>
        </div>
      `;
      return;
    }

    const lsdaParser = new LsdaParser(lsdaData, { fdeInitialLocation: entry.initialLocation });
    const result = lsdaParser.parse();

    if (!result.callSites || result.callSites.length === 0) {
      this.elements.landingPadContainer.innerHTML = "<p style='color: var(--text-muted);'>No call sites found in LSDA table.</p>";
      return;
    }

    const cardsHtml = result.callSites.map(cs => {
      const badgeClass = cs.hasLandingPad ? "lp-present" : "lp-none";
      const badgeText = cs.hasLandingPad ? `Landing Pad: ${cs.formattedLandingPad}` : "No Landing Pad (Terminate)";
      return `
        <div class="callsite-card ${cs.hasLandingPad ? 'has-landing-pad' : ''}">
          <div class="callsite-header">
            <span>Try Range: <strong>${cs.formattedRange}</strong> (+0x${cs.csStart.toString(16)}, len: ${cs.csLen})</span>
            <span class="landing-pad-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-secondary); display: flex; gap: 16px; margin-top: 4px;">
            <span>Action Offset: ${cs.actionOffset}</span>
            <span>Handler Kind: <strong>${cs.kind}</strong></span>
          </div>
        </div>
      `;
    }).join("");

    this.elements.landingPadContainer.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Protected Code Ranges & Exception Landing Pads</h3>
        <p style="font-size: 0.82rem; color: var(--text-muted);">
          Immunity Invariant: Landing pads and cleanup addresses mapped here must never be stripped during binary linking or optimization.
        </p>
      </div>
      ${cardsHtml}
    `;
  }

  renderElfHeaders(elfHeader, sections) {
    if (!elfHeader) {
      this.elements.elfHeaderContainer.innerHTML = `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; text-align: center;">
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            No ELF binary loaded. Upload a valid ELF or PRX binary (or <strong>Sample 5</strong>) to inspect ELF headers and sections.
          </p>
        </div>
      `;
      return;
    }

    const headerCardsHtml = `
      <div class="prop-grid" style="margin-bottom: 20px;">
        <div class="prop-card"><div class="prop-key">Class & Endian</div><div class="prop-val">${elfHeader.eiClassName} (${elfHeader.eiDataName})</div></div>
        <div class="prop-card"><div class="prop-key">ELF Type</div><div class="prop-val" style="color: var(--accent-blue);">${elfHeader.eTypeName}</div></div>
        <div class="prop-card"><div class="prop-key">Target Machine</div><div class="prop-val" style="color: var(--accent-green);">${elfHeader.eMachineName}</div></div>
        <div class="prop-card"><div class="prop-key">Entrypoint Virtual Address</div><div class="prop-val">0x${elfHeader.eEntry.toString(16)}</div></div>
        <div class="prop-card"><div class="prop-key">Section Headers</div><div class="prop-val">${elfHeader.eShnum} entries @ offset 0x${elfHeader.eShoff.toString(16)}</div></div>
        <div class="prop-card"><div class="prop-key">String Table Index</div><div class="prop-val">Section #${elfHeader.eShstrndx}</div></div>
      </div>
    `;

    const sectionRowsHtml = (sections || []).map(sec => {
      const isUnwind = sec.name === ".eh_frame" || sec.name === ".eh_frame_hdr" || sec.name === ".gcc_except_table";
      const highlight = isUnwind ? "style='color: var(--accent-blue); font-weight: 700;'" : "";
      return `
        <tr>
          <td>#${sec.index}</td>
          <td ${highlight}>${escapeHtml(sec.name || "(unnamed)")}</td>
          <td>${escapeHtml(sec.typeName)}</td>
          <td>0x${sec.addr.toString(16)}</td>
          <td>0x${sec.offset.toString(16)}</td>
          <td>${sec.size} bytes</td>
          <td>0x${sec.flags.toString(16)}</td>
        </tr>
      `;
    }).join("");

    this.elements.elfHeaderContainer.innerHTML = `
      <div class="detail-section">
        <div class="detail-title">ELF Binary Header Breakdown</div>
        ${headerCardsHtml}
      </div>
      <div class="detail-section">
        <div class="detail-title">Section Header Table (${sections ? sections.length : 0} Sections)</div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Idx</th>
                <th>Name</th>
                <th>Type</th>
                <th>Virtual Addr</th>
                <th>File Offset</th>
                <th>Size</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              ${sectionRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderHexInspector(buffer, highlightRange = null) {
    if (!buffer || buffer.byteLength === 0) {
      this.elements.hexInspector.innerHTML = "<p style='color: var(--text-muted);'>No bytecode loaded.</p>";
      return;
    }

    const maxBytes = Math.min(buffer.byteLength, 4096); // Render up to 4KB for responsive scrolling
    const rows = [];

    for (let i = 0; i < maxBytes; i += 16) {
      const chunk = buffer.subarray(i, Math.min(i + 16, maxBytes));
      const bytesHtml = [];
      let ascii = "";

      for (let j = 0; j < 16; j++) {
        if (j < chunk.length) {
          const byteOffset = i + j;
          const byteVal = chunk[j];
          const isHighlighted = highlightRange && byteOffset >= highlightRange.start && byteOffset < highlightRange.end;
          bytesHtml.push(`
            <span class="hex-byte ${isHighlighted ? 'highlight' : ''}" data-offset="${byteOffset}">
              ${byteVal.toString(16).padStart(2, "0")}
            </span>
          `);
          ascii += (byteVal >= 32 && byteVal <= 126) ? String.fromCharCode(byteVal) : ".";
        } else {
          bytesHtml.push(`<span class="hex-byte" style="opacity: 0.2;">..</span>`);
          ascii += " ";
        }
      }

      rows.push(`
        <div class="hex-row">
          <span class="hex-addr">0x${i.toString(16).padStart(6, "0")}</span>
          <div class="hex-bytes">${bytesHtml.join("")}</div>
          <span class="hex-ascii">${escapeHtml(ascii)}</span>
        </div>
      `);
    }

    if (buffer.byteLength > maxBytes) {
      rows.push(`
        <div style="padding: 10px; color: var(--text-muted); text-align: center;">
          ... truncated ${buffer.byteLength - maxBytes} additional bytes ...
        </div>
      `);
    }

    this.elements.hexInspector.innerHTML = rows.join("");

    // Auto scroll to highlighted byte if available
    if (highlightRange) {
      const targetElem = this.elements.hexInspector.querySelector(`.hex-byte[data-offset="${highlightRange.start}"]`);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
