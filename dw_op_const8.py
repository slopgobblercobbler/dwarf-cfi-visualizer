def decode_dw_op_const8(opcode, val, signed=False):
    return f'DW_OP_const8{"s" if signed else "u"} {val}'
