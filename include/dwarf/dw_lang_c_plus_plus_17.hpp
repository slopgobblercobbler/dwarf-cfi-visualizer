#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlus17Def {
    static constexpr std::uint32_t lang_code = 0x002a;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_17";
    static constexpr std::string_view desc = "ISO C++ 2017 standard source language identifier";
};
}
