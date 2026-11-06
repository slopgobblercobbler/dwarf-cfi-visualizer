#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpGnuDerefTypeDef {
    static constexpr std::uint8_t opcode = 0xf6;
    static constexpr std::string_view name = "DW_OP_GNU_deref_type";
    static constexpr std::string_view desc = "GNU extension for typed pointer dereferencing on stack";
};
}
