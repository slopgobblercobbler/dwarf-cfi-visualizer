#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpPieceDef {
    static constexpr std::uint8_t opcode = 0x93;
    static constexpr std::string_view name = "DW_OP_piece";
    static constexpr std::string_view desc = "Describes placement of a piece of an object in composite memory/register";
};
}
