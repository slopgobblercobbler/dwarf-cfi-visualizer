#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagImportedModuleDef {
    static constexpr std::uint32_t tag = 0x3a;
    static constexpr std::string_view name = "DW_TAG_imported_module";
    static constexpr std::string_view desc = "Represents a namespace or module imported into current scope";
};
}
