#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangRustDef {
    static constexpr std::uint16_t code = 0x001c;
    static constexpr std::string_view name = "DW_LANG_Rust";
    static constexpr std::string_view standard = "Rust Programming Language";
};
}
