#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCpp20Def {
    static constexpr std::uint16_t code = 0x002c;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_20";
    static constexpr std::string_view standard = "ISO/IEC 14882:2020 C++20 Standard";
};
}
