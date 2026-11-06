#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagClassTypeDef {
    static constexpr std::uint16_t tag = 0x02;
    static constexpr std::string_view name = "DW_TAG_class_type";
    static constexpr std::string_view desc = "DWARF class type debugging descriptor";
};
}
