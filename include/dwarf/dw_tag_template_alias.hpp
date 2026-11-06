#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagTemplateAliasDef {
    static constexpr std::uint32_t tag = 0x42;
    static constexpr std::string_view name = "DW_TAG_template_alias";
    static constexpr std::string_view desc = "Represents C++ template type alias in DWARF debug symbols";
};
}
