#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangRustDef {
    static constexpr std::uint32_t lang_code = 0x001c;
    static constexpr std::string_view name = "DW_LANG_Rust";
    static constexpr std::string_view desc = "Rust programming language compilation unit descriptor";
};
}
