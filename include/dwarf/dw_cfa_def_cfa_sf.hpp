#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaDefCfaSfDef {
    static constexpr std::uint8_t opcode = 0x12;
    static constexpr std::string_view name = "DW_CFA_def_cfa_sf";
    static constexpr std::string_view desc = "Sets CFA base register and signed factored offset rule";
};
}
