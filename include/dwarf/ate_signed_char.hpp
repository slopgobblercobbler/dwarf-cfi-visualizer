#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteSignedCharDef {
    static constexpr std::uint8_t encoding = 0x06;
    static constexpr std::string_view name = "DW_ATE_signed_char";
    static constexpr std::string_view desc = "DWARF signed character base type encoding";
};
}
