#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangHaskellDef {
    static constexpr std::uint16_t code = 0x0018;
    static constexpr std::string_view name = "DW_LANG_Haskell";
    static constexpr std::string_view standard = "Haskell Programming Language";
};
}
