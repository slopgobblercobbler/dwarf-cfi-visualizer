export interface DWARF_CIE {
    length: number;
    cieId: number;
    version: number;
    augmentation: string;
    codeAlignmentFactor: number;
    dataAlignmentFactor: number;
    returnAddressRegister: number;
    initialInstructions: Uint8Array;
}

export interface DWARF_FDE {
    length: number;
    ciePointer: number;
    initialLocation: bigint;
    addressRange: bigint;
    instructions: Uint8Array;
}
