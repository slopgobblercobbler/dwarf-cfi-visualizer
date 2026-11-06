#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteUtfDef {
    static constexpr std::uint8_t encoding = 0x10;
    static constexpr std::string_view name = "DW_ATE_UTF";
    static constexpr std::string_view desc = "Unicode character string base type encoding";
};
}
