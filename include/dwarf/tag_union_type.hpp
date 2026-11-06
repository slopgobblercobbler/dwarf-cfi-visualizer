#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagUnionTypeDef {
    static constexpr std::uint16_t tag = 0x17;
    static constexpr std::string_view name = "DW_TAG_union_type";
    static constexpr std::string_view desc = "DWARF union type debugging descriptor";
};
}
