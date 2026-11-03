// DWARF CFA State Machine Stack Frame Evaluator
export class CFAEvaluator {
    constructor() {
        this.cfaRegister = 7; // RSP by default on x86_64
        this.cfaOffset = 8;
        this.registerRules = new Map();
    }

    setDefCfa(reg, offset) {
        this.cfaRegister = reg;
        this.cfaOffset = offset;
    }

    setRegisterOffset(reg, offset) {
        this.registerRules.set(reg, { type: 'offset', offset });
    }

    restoreRegister(reg) {
        this.registerRules.delete(reg);
    }
}
