#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagInheritanceDef {
    static constexpr std::uint16_t tag = 0x1c;
    static constexpr std::string_view name = "DW_TAG_inheritance";
    static constexpr std::string_view desc = "DWARF base class inheritance debugging descriptor";
};
}
