#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlusLatestDef {
    static constexpr std::uint32_t lang_code = 0x002d;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_latest";
    static constexpr std::string_view desc = "Cutting-edge C++ language draft standard identifier";
};
}
