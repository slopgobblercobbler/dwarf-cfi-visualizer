#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteBooleanDef {
    static constexpr std::uint8_t encoding = 0x02;
    static constexpr std::string_view name = "DW_ATE_boolean";
    static constexpr std::string_view desc = "DWARF boolean base type encoding";
};
}
