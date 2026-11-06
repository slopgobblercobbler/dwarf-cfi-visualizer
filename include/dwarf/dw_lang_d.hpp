#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangDDef {
    static constexpr std::uint32_t lang_code = 0x0013;
    static constexpr std::string_view name = "DW_LANG_D";
    static constexpr std::string_view desc = "D programming language compilation unit descriptor";
};
}
