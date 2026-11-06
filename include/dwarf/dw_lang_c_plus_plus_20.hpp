#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlus20Def {
    static constexpr std::uint32_t lang_code = 0x002b;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_20";
    static constexpr std::string_view desc = "ISO C++ 2020 standard source language identifier";
};
}
