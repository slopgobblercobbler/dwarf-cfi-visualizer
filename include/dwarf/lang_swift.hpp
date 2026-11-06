#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangSwiftDef {
    static constexpr std::uint16_t code = 0x001e;
    static constexpr std::string_view name = "DW_LANG_Swift";
    static constexpr std::string_view standard = "Swift Programming Language";
};
}
