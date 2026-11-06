#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpStackValueDef {
    static constexpr std::uint8_t opcode = 0x9f;
    static constexpr std::string_view name = "DW_OP_stack_value";
    static constexpr std::string_view desc = "Marks top of DWARF stack as the object value rather than address";
};
}
