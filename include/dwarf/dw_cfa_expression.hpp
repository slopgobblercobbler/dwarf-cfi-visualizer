#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaExpressionDef {
    static constexpr std::uint8_t opcode = 0x10;
    static constexpr std::string_view name = "DW_CFA_expression";
    static constexpr std::string_view desc = "Defines register rule computing memory location via DWARF expression";
};
}
