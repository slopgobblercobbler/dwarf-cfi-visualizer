#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaDefCfaExpressionDef {
    static constexpr std::uint8_t opcode = 0x0f;
    static constexpr std::string_view name = "DW_CFA_def_cfa_expression";
    static constexpr std::string_view desc = "Calculates Canonical Frame Address via DWARF expression evaluation";
};
}
