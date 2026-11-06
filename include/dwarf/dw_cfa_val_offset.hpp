#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaValOffsetDef {
    static constexpr std::uint8_t opcode = 0x14;
    static constexpr std::string_view name = "DW_CFA_val_offset";
    static constexpr std::string_view desc = "Defines register rule calculating target value as CFA plus factored offset";
};
}
