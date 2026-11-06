#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpDropDef {
    static constexpr std::uint8_t opcode = 0x13;
    static constexpr std::string_view name = "DW_OP_drop";
    static constexpr std::string_view desc = "Pops top stack element in DWARF expression evaluation";
};
}
