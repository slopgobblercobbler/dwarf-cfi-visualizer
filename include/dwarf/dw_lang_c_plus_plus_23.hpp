#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlus23Def {
    static constexpr std::uint32_t lang_code = 0x002c;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_23";
    static constexpr std::string_view desc = "ISO C++ 2023 standard source language identifier";
};
}
