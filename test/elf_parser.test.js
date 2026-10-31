// test/elf_parser.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { ElfParser } from "../js/elf_parser.js";
import { createSyntheticElf64Binary } from "../js/samples.js";

test("ElfParser rejects non-ELF binaries", () => {
  const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
  assert.equal(ElfParser.isElfBinary(garbage), false);

  const parser = new ElfParser(garbage);
  assert.throws(() => parser.parse(), /Missing ELF magic header/);
});

test("ElfParser parses synthetic ELF64 binary header and sections", () => {
  const binary = createSyntheticElf64Binary();
  assert.equal(ElfParser.isElfBinary(binary), true);

  const parser = new ElfParser(binary);
  const header = parser.parse();

  assert.equal(header.is64Bit, true);
  assert.equal(header.isLittleEndian, true);
  assert.equal(header.eTypeName, "ET_EXEC (Executable)");
  assert.equal(header.eMachineName, "AMD x86-64");
  assert.equal(header.eEntry, 0x401000n);
  assert.equal(header.eShnum, 4);

  // Check parsed sections
  assert.equal(parser.sections.length, 4);
  const textSec = parser.findSection(".text");
  assert.ok(textSec);
  assert.equal(textSec.name, ".text");
  assert.equal(textSec.addr, 0x401000n);

  const ehFrameSec = parser.findSection(".eh_frame");
  assert.ok(ehFrameSec);
  assert.equal(ehFrameSec.name, ".eh_frame");

  // Extract .eh_frame
  const ehFrameData = parser.getEhFrame();
  assert.ok(ehFrameData);
  assert.ok(ehFrameData.buffer.byteLength > 0);
  assert.equal(ehFrameData.virtualAddress, 0x402000n);
});
