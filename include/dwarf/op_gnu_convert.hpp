#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpGnuConvertDef {
    static constexpr std::uint8_t opcode = 0xf7;
    static constexpr std::string_view name = "DW_OP_GNU_convert";
    static constexpr std::string_view desc = "GNU extension for casting stack entry to target DIE type";
};
}
