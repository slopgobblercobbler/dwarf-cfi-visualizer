#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteUnsignedCharDef {
    static constexpr std::uint8_t encoding = 0x08;
    static constexpr std::string_view name = "DW_ATE_unsigned_char";
    static constexpr std::string_view desc = "DWARF unsigned character base type encoding";
};
}
