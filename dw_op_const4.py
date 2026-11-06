def decode_dw_op_const4(opcode, val, signed=False):
    return f'DW_OP_const4{"s" if signed else "u"} {val}'
