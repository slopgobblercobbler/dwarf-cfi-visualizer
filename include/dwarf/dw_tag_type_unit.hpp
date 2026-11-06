#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagTypeUnitDef {
    static constexpr std::uint32_t tag = 0x41;
    static constexpr std::string_view name = "DW_TAG_type_unit";
    static constexpr std::string_view desc = "Represents a distinct type unit DIE header in DWARF 4+ debug records";
};
}
