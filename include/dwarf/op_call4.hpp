#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpCall4Def {
    static constexpr std::uint8_t opcode = 0x99;
    static constexpr std::string_view name = "DW_OP_call4";
    static constexpr std::string_view desc = "Performs DWARF subprogram invocation with 4-byte DIE offset";
};
}
