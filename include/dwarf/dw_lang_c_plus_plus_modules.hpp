#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlusModulesDef {
    static constexpr std::uint32_t lang_code = 0x002e;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_modules";
    static constexpr std::string_view desc = "ISO C++ 2020 modules compilation unit identifier";
};
}
