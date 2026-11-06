#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpXderefSizeDef {
    static constexpr std::uint8_t opcode = 0x95;
    static constexpr std::string_view name = "DW_OP_xderef_size";
    static constexpr std::string_view desc = "Extended address space dereference with specified byte size";
};
}
