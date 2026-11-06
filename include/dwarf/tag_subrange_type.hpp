#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagSubrangeTypeDef {
    static constexpr std::uint16_t tag = 0x21;
    static constexpr std::string_view name = "DW_TAG_subrange_type";
    static constexpr std::string_view desc = "DWARF array subrange dimension debugging tag";
};
}
