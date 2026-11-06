#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagConditionDef {
    static constexpr std::uint32_t tag = 0x3f;
    static constexpr std::string_view name = "DW_TAG_condition";
    static constexpr std::string_view desc = "Represents conditional compilation or branch condition in debug info";
};
}
