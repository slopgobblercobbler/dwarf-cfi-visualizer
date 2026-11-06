#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangZigDef {
    static constexpr std::uint16_t code = 0x0028;
    static constexpr std::string_view name = "DW_LANG_Zig";
    static constexpr std::string_view standard = "Zig Programming Language";
};
}
