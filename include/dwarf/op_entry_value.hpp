#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpEntryValueDef {
    static constexpr std::uint8_t opcode = 0xa3;
    static constexpr std::string_view name = "DW_OP_entry_value";
    static constexpr std::string_view desc = "Pushes value of register or memory at function entry";
};
}
