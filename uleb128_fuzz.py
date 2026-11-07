def encode_uleb128(val):
    res = bytearray()
    while True:
        b = val & 0x7F
        val >>= 7
        if val != 0: b |= 0x80
        res.append(b)
        if val == 0: break
    return bytes(res)
