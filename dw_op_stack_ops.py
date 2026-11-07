def decode_stack_op(opcode):
    return 'DW_OP_deref' if opcode == 0x06 else 'DW_OP_dup'
