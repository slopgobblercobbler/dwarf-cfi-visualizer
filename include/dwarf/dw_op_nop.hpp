#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpNopDef {
    static constexpr std::uint8_t opcode = 0x96;
    static constexpr std::string_view name = "DW_OP_nop";
    static constexpr std::string_view desc = "No-operation expression padding instruction";
};
}
