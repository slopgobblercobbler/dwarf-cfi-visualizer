#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaDefCfaOffsetSfDef {
    static constexpr std::uint8_t opcode = 0x13;
    static constexpr std::string_view name = "DW_CFA_def_cfa_offset_sf";
    static constexpr std::string_view desc = "Updates CFA rule offset using signed factored displacement";
};
}
