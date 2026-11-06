#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaValExpressionDef {
    static constexpr std::uint8_t opcode = 0x16;
    static constexpr std::string_view name = "DW_CFA_val_expression";
    static constexpr std::string_view desc = "Defines register rule computing target register value via DWARF expression";
};
}
