#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteNumericStringDef {
    static constexpr std::uint8_t encoding = 0x0f;
    static constexpr std::string_view name = "DW_ATE_numeric_string";
    static constexpr std::string_view desc = "Numeric character string base type encoding";
};
}
