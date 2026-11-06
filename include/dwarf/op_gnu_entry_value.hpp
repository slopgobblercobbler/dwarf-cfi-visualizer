#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpGnuEntryValueDef {
    static constexpr std::uint8_t opcode = 0xf3;
    static constexpr std::string_view name = "DW_OP_GNU_entry_value";
    static constexpr std::string_view desc = "GNU extension for parameter value evaluation at call site entry";
};
}
