#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangKotlinDef {
    static constexpr std::uint16_t code = 0x002c;
    static constexpr std::string_view name = "DW_LANG_Kotlin";
    static constexpr std::string_view standard = "Kotlin Programming Language";
};
}
