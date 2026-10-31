// lsda_parser.js - C++ Exception Handling & Landing Pad Parser (.gcc_except_table)

import { BinaryReader } from "./binary_reader.js";
import { DW_EH_PE, formatPointerEncoding } from "./dwarf_parser.js";

export class LsdaParser {
  /**
   * @param {Uint8Array|ArrayBuffer} buffer
   * @param {object} [options]
   * @param {bigint|number} [options.fdeInitialLocation=0n]
   * @param {bigint|number} [options.baseVirtualAddress=0n]
   */
  constructor(buffer, options = {}) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.fdeInitialLocation = BigInt(options.fdeInitialLocation ?? 0n);
    this.baseVirtualAddress = BigInt(options.baseVirtualAddress ?? 0n);

    this.header = null;
    this.callSites = [];
    this.actions = [];
    this.errors = [];
  }

  parse() {
    if (!this.buffer || this.buffer.byteLength === 0) {
      return { header: null, callSites: [], actions: [], errors: ["Empty LSDA buffer"] };
    }

    const reader = new BinaryReader(this.buffer);
    reader.baseVirtualAddress = this.baseVirtualAddress;

    try {
      // 1. LPStart encoding & value
      const lpStartEncoding = reader.readUint8();
      let lpStart = this.fdeInitialLocation;

      if (lpStartEncoding !== DW_EH_PE.omit) {
        const lpStartRes = reader.readEncodedPointer(lpStartEncoding);
        lpStart = lpStartRes.value;
      }

      // 2. Type Table encoding & base offset
      const ttypeEncoding = reader.readUint8();
      let ttypeOffset = 0;
      if (ttypeEncoding !== DW_EH_PE.omit) {
        ttypeOffset = Number(reader.readULEB128());
      }

      // 3. Call site encoding & table length
      const callSiteEncoding = reader.readUint8();
      const callSiteTableLength = Number(reader.readULEB128());

      const callSiteTableStart = reader.offset;
      const callSiteTableEnd = callSiteTableStart + callSiteTableLength;

      if (callSiteTableEnd > this.buffer.byteLength) {
        throw new RangeError(
          `Call site table length ${callSiteTableLength} exceeds LSDA buffer (${this.buffer.byteLength})`
        );
      }

      this.header = {
        lpStartEncoding,
        lpStartEncodingName: formatPointerEncoding(lpStartEncoding),
        lpStart,
        ttypeEncoding,
        ttypeEncodingName: formatPointerEncoding(ttypeEncoding),
        ttypeOffset,
        callSiteEncoding,
        callSiteEncodingName: formatPointerEncoding(callSiteEncoding),
        callSiteTableLength,
        callSiteTableStart,
        callSiteTableEnd
      };

      // 4. Parse Call Site Table
      const csReader = reader.slice(callSiteTableStart, callSiteTableLength);
      csReader.baseVirtualAddress = reader.baseVirtualAddress + BigInt(callSiteTableStart);

      let csIndex = 0;
      while (!csReader.isEOF()) {
        const startRes = csReader.readEncodedPointer(callSiteEncoding, lpStart);
        const lenRes = csReader.readEncodedPointer(callSiteEncoding & 0x0F);
        const lpRes = csReader.readEncodedPointer(callSiteEncoding, lpStart);
        const actionOffset = Number(csReader.readULEB128());

        const csStart = startRes.raw;
        const csLen = lenRes.raw;
        const csLp = lpRes.raw;

        const hasLandingPad = csLp !== 0n;
        const landingPadAddr = hasLandingPad ? (lpStart + csLp) : 0n;
        const callSiteStartAddr = lpStart + csStart;
        const callSiteEndAddr = callSiteStartAddr + csLen;

        let kind = "none";
        if (hasLandingPad) {
          kind = actionOffset === 0 ? "cleanup" : "catch_handler";
        }

        this.callSites.push({
          index: csIndex++,
          csStart: Number(csStart),
          csLen: Number(csLen),
          csLp: Number(csLp),
          actionOffset,
          hasLandingPad,
          landingPadAddress: landingPadAddr,
          formattedLandingPad: hasLandingPad ? `0x${landingPadAddr.toString(16)}` : "None (terminate)",
          callSiteStart: callSiteStartAddr,
          callSiteEnd: callSiteEndAddr,
          formattedRange: `0x${callSiteStartAddr.toString(16)} - 0x${callSiteEndAddr.toString(16)}`,
          kind
        });
      }

      // 5. Parse Action Table if present
      reader.seek(callSiteTableEnd);
      let actionIdx = 0;
      while (reader.remaining >= 2 && actionIdx < 100) {
        const actionStart = reader.offset - callSiteTableEnd;
        try {
          const typeFilter = reader.readSLEB128();
          const nextOffset = reader.readSLEB128();

          this.actions.push({
            index: actionIdx++,
            offset: actionStart,
            typeFilter: Number(typeFilter),
            nextOffset: Number(nextOffset),
            desc: typeFilter > 0 ? `Catch type #${typeFilter}` : (typeFilter === 0 ? "Cleanup" : `Exception spec #${-typeFilter}`)
          });

          if (nextOffset === 0) break;
        } catch {
          break;
        }
      }

    } catch (err) {
      this.errors.push(`LSDA parse error: ${err.message}`);
    }

    return {
      header: this.header,
      callSites: this.callSites,
      actions: this.actions,
      errors: this.errors
    };
  }
}
