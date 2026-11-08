def parse_lsda_ptr(b, encoding):
    return {'encoding': encoding, 'ptr': int.from_bytes(b[:8], 'little')}
