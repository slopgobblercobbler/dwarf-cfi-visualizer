#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpOverDef {
    static constexpr std::uint8_t opcode = 0x14;
    static constexpr std::string_view name = "DW_OP_over";
    static constexpr std::string_view desc = "Duplicates the second stack element onto the top of evaluation stack";
};
}
