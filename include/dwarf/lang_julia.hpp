#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangJuliaDef {
    static constexpr std::uint16_t code = 0x001f;
    static constexpr std::string_view name = "DW_LANG_Julia";
    static constexpr std::string_view standard = "Julia Programming Language";
};
}
