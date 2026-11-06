#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpRotDef {
    static constexpr std::uint8_t opcode = 0x17;
    static constexpr std::string_view name = "DW_OP_rot";
    static constexpr std::string_view desc = "Rotates top three stack entries";
};
}
