/**
 * DWARF SLEB128 Displacement Decoding & Landing Pad Test Suite
 */

function runSleb128Tests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  console.log("Running DWARF SLEB128 Displacement Tests...");

  // SLEB128 Decoder implementation
  function decodeSleb128(bytes) {
    let result = 0;
    let shift = 0;
    let index = 0;
    let byte = 0;
    do {
      if (index >= bytes.length) throw new Error("Truncated SLEB128");
      byte = bytes[index++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while ((byte & 0x80) !== 0);

    if (shift < 32 && (byte & 0x40) !== 0) {
      result |= -(1 << shift);
    }
    return { value: result, bytesRead: index };
  }

  // 1. Positive displacement
  assert(decodeSleb128([0x00]).value === 0, "Decodes 0");
  assert(decodeSleb128([0x01]).value === 1, "Decodes +1");
  assert(decodeSleb128([0x3f]).value === 63, "Decodes +63");

  // 2. Negative displacement (two's-complement)
  assert(decodeSleb128([0x7f]).value === -1, "Decodes -1");
  assert(decodeSleb128([0x7e]).value === -2, "Decodes -2");
  assert(decodeSleb128([0x40]).value === -64, "Decodes -64");

  // 3. Multi-byte SLEB128
  assert(decodeSleb128([0x80, 0x7f]).value === -128, "Decodes -128");

  // 4. Data Alignment Factor Multiplication (-8 on x86_64)
  const dataAlignmentFactor = -8;
  const decodedFactored = decodeSleb128([0x7e]).value; // -2
  const finalOffset = decodedFactored * dataAlignmentFactor;
  assert(finalOffset === 16, "Offset factored correctly: -2 * -8 = 16");

  console.log(`DWARF Visualizer Results: ${passed} passed, ${failed} failed.`);
  return failed === 0;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSleb128Tests };
}
