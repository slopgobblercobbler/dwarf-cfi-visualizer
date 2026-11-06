#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpBitPieceDef {
    static constexpr std::uint8_t opcode = 0x9d;
    static constexpr std::string_view name = "DW_OP_bit_piece";
    static constexpr std::string_view desc = "Specifies bit size and bit offset of a piece in composite object";
};
}
