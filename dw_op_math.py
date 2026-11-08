def decode_abs_neg(op, val):
    return abs(val) if op == 0x19 else -val
