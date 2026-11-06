def validate_fde_range(pc_begin, pc_range, text_base, text_size):
    return pc_begin >= text_base and (pc_begin + pc_range) <= (text_base + text_size)
