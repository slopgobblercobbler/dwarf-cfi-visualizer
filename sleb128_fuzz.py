def generate_sleb128_fuzz_cases():
    return [-1, -64, -65, -128, 63, 64, 127, -2147483648, 2147483647]
