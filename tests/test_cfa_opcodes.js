import assert from 'assert';
import opcodes from '../src/cfa_opcodes.json' assert { type: 'json' };

describe('DWARF CFA Opcodes', () => {
    it('should map primary instructions correctly', () => {
        assert.strictEqual(opcodes.DW_CFA_advance_loc, 0x40);
        assert.strictEqual(opcodes.DW_CFA_offset, 0x80);
        assert.strictEqual(opcodes.DW_CFA_restore, 0xc0);
    });

    it('should map secondary extended instructions correctly', () => {
        assert.strictEqual(opcodes.DW_CFA_def_cfa, 0x0c);
        assert.strictEqual(opcodes.DW_CFA_def_cfa_register, 0x0d);
    });
});
