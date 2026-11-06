#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpXderefDef {
    static constexpr std::uint8_t opcode = 0x18;
    static constexpr std::string_view name = "DW_OP_xderef";
    static constexpr std::string_view desc = "Pops address and address space identifier and dereferences value";
};
}
