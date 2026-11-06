#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteComplexFloatDef {
    static constexpr std::uint8_t encoding = 0x09;
    static constexpr std::string_view name = "DW_ATE_complex_float";
    static constexpr std::string_view desc = "Complex floating-point numerical base type encoding";
};
}
