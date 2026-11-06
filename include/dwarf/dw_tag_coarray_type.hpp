#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagCoarrayTypeDef {
    static constexpr std::uint32_t tag = 0x44;
    static constexpr std::string_view name = "DW_TAG_coarray_type";
    static constexpr std::string_view desc = "Represents Fortran coarray type in DWARF debug symbols";
};
}
