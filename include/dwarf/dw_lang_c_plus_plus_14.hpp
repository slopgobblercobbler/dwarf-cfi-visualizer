#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlus14Def {
    static constexpr std::uint32_t lang_code = 0x0021;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_14";
    static constexpr std::string_view desc = "ISO C++ 2014 standard source language identifier";
};
}
