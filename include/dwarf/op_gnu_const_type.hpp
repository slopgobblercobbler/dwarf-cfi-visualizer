#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpGnuConstTypeDef {
    static constexpr std::uint8_t opcode = 0xf4;
    static constexpr std::string_view name = "DW_OP_GNU_const_type";
    static constexpr std::string_view desc = "GNU extension for pushing typed constant object to stack";
};
}
