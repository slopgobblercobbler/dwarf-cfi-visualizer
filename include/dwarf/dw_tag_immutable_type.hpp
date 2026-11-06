#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagImmutableTypeDef {
    static constexpr std::uint32_t tag = 0x48;
    static constexpr std::string_view name = "DW_TAG_immutable_type";
    static constexpr std::string_view desc = "Represents immutable qualified type in DWARF debug symbols";
};
}
