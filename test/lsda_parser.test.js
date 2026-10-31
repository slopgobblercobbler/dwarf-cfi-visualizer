// test/lsda_parser.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { LsdaParser } from "../js/lsda_parser.js";
import { DW_EH_PE } from "../js/dwarf_parser.js";

test("LsdaParser decodes standard C++ exception call site table and landing pads", () => {
  // Synthetic LSDA:
  // lpstart_encoding: DW_EH_PE_omit (0xFF) -> lpstart = fdeInitialLocation (0x401000)
  // ttype_encoding: DW_EH_PE_omit (0xFF)
  // call_site_encoding: DW_EH_PE_uleb128 (0x01)
  // call_site_table_length: 12 bytes
  // Call Site 1: start: 0x00, len: 0x20, landing_pad: 0x30, action: 1 (catch)
  // Call Site 2: start: 0x20, len: 0x10, landing_pad: 0x00, action: 0 (terminate)
  // Call Site 3: start: 0x30, len: 0x15, landing_pad: 0x45, action: 0 (cleanup)

  const lsdaBytes = new Uint8Array([
    0xFF, // lpstart_encoding (omit)
    0xFF, // ttype_encoding (omit)
    0x01, // call_site_encoding (uleb128)
    0x0C, // call_site_table_length (12 bytes: 3 call sites * 4 bytes)

    // Call site 1: start 0, len 0x20, lp 0x30, action 1
    0x00, 0x20, 0x30, 0x01,
    // Call site 2: start 0x20, len 0x10, lp 0, action 0
    0x20, 0x10, 0x00, 0x00,
    // Call site 3: start 0x30, len 0x15, lp 0x45, action 0
    0x30, 0x15, 0x45, 0x00
  ]);

  const parser = new LsdaParser(lsdaBytes, { fdeInitialLocation: 0x401000n });
  const result = parser.parse();

  assert.equal(result.errors.length, 0);
  assert.equal(result.header.lpStart, 0x401000n);
  assert.equal(result.callSites.length, 3);

  // Call site 1
  const cs1 = result.callSites[0];
  assert.equal(cs1.hasLandingPad, true);
  assert.equal(cs1.landingPadAddress, 0x401030n);
  assert.equal(cs1.kind, "catch_handler");

  // Call site 2 (no landing pad)
  const cs2 = result.callSites[1];
  assert.equal(cs2.hasLandingPad, false);
  assert.equal(cs2.landingPadAddress, 0n);
  assert.equal(cs2.kind, "none");

  // Call site 3 (cleanup landing pad)
  const cs3 = result.callSites[2];
  assert.equal(cs3.hasLandingPad, true);
  assert.equal(cs3.landingPadAddress, 0x401045n);
  assert.equal(cs3.kind, "cleanup");
});
