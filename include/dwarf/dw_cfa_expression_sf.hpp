#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaExpressionSfDef {
    static constexpr std::string_view name = "DW_CFA_expression_sf";
    static constexpr std::string_view desc = "Signed factored DWARF expression memory location rule instruction";
};
}
