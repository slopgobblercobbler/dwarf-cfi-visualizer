def decode_breg(opcode, offset):
    reg = opcode - 0x70
    return f'DW_OP_breg{reg} {offset}'
