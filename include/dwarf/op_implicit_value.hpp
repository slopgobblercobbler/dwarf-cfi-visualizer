#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpImplicitValueDef {
    static constexpr std::uint8_t opcode = 0x9e;
    static constexpr std::string_view name = "DW_OP_implicit_value";
    static constexpr std::string_view desc = "Specifies immediate byte sequence representing object value";
};
}
