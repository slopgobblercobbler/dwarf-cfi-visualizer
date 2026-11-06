#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteComplexFloatDef {
    static constexpr std::uint8_t encoding = 0x05;
    static constexpr std::string_view name = "DW_ATE_complex_float";
    static constexpr std::string_view desc = "DWARF complex floating-point base type encoding";
};
}
