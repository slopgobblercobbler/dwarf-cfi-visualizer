import assert from 'assert';
import regs from '../src/x86_registers.json' assert { type: 'json' };

describe('x86_64 Register Map', () => {
    it('should map RIP to register 16', () => {
        assert.strictEqual(regs['16'], 'RIP');
    });
    it('should map RSP to register 7', () => {
        assert.strictEqual(regs['7'], 'RSP');
    });
});
