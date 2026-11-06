#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagAtomicTypeDef {
    static constexpr std::uint32_t tag = 0x47;
    static constexpr std::string_view name = "DW_TAG_atomic_type";
    static constexpr std::string_view desc = "Represents atomic qualified type in DWARF 5 debug records";
};
}
