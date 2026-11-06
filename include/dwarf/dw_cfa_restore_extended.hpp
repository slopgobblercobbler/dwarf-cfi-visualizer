#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaRestoreExtendedDef {
    static constexpr std::uint8_t opcode = 0x06;
    static constexpr std::string_view name = "DW_CFA_restore_extended";
    static constexpr std::string_view desc = "Restores register rule to initial CIE value using ULEB128 register operand";
};
}
