def decode_drop_over(opcode):
    return 'DW_OP_drop' if opcode == 0x13 else 'DW_OP_over'
