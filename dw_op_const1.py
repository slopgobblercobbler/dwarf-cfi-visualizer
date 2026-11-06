def decode_dw_op_const1(opcode, val, signed=False):
    return f'DW_OP_const1{"s" if signed else "u"} {val}'
