#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagFileTypeDef {
    static constexpr std::uint32_t tag = 0x29;
    static constexpr std::string_view name = "DW_TAG_file_type";
    static constexpr std::string_view desc = "Represents a file type in source language debug symbols";
};
}
