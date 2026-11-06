#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpCall2Def {
    static constexpr std::uint8_t opcode = 0x98;
    static constexpr std::string_view name = "DW_OP_call2";
    static constexpr std::string_view desc = "Performs DWARF subprogram invocation with 2-byte DIE offset";
};
}
