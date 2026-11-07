def decode_lit(opcode):
    return f'DW_OP_lit{opcode - 0x30}'
