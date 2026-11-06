#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagTypedefDef {
    static constexpr std::uint16_t tag = 0x16;
    static constexpr std::string_view name = "DW_TAG_typedef";
    static constexpr std::string_view desc = "DWARF type definition alias debugging descriptor";
};
}
