def decode_dw_op_rot(stack):
    return stack[-1:] + stack[:-1] if len(stack) >= 3 else stack
