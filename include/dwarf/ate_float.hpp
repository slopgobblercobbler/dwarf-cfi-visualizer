#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteFloatDef {
    static constexpr std::uint8_t encoding = 0x04;
    static constexpr std::string_view name = "DW_ATE_float";
    static constexpr std::string_view desc = "DWARF IEEE floating-point base type encoding";
};
}
