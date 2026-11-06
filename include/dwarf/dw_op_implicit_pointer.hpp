#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpImplicitPointerDef {
    static constexpr std::uint8_t opcode = 0xa0;
    static constexpr std::string_view name = "DW_OP_implicit_pointer";
    static constexpr std::string_view desc = "Specifies implicit pointer referencing an optimized-out object DIE";
};
}
