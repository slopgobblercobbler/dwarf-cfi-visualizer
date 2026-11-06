#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwCfaValExpressionExtDef {
    static constexpr std::string_view name = "DW_CFA_val_expression_ext";
    static constexpr std::string_view desc = "Extended register rule evaluation via DWARF expression computation";
};
}
