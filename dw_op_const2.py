def decode_dw_op_const2(opcode, val, signed=False):
    return f'DW_OP_const2{"s" if signed else "u"} {val}'
