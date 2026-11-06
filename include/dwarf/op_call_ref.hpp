#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpCallRefDef {
    static constexpr std::uint8_t opcode = 0x9a;
    static constexpr std::string_view name = "DW_OP_call_ref";
    static constexpr std::string_view desc = "Performs DWARF subprogram invocation with executable-relative offset";
};
}
