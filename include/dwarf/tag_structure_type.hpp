#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagStructureTypeDef {
    static constexpr std::uint16_t tag = 0x13;
    static constexpr std::string_view name = "DW_TAG_structure_type";
    static constexpr std::string_view desc = "DWARF structure type debugging tag";
};
}
