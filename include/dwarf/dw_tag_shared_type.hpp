#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagSharedTypeDef {
    static constexpr std::uint32_t tag = 0x40;
    static constexpr std::string_view name = "DW_TAG_shared_type";
    static constexpr std::string_view desc = "Represents UPC shared variable type in debug records";
};
}
