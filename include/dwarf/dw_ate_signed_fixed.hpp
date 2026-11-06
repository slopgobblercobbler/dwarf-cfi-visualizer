#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteSignedFixedDef {
    static constexpr std::uint8_t encoding = 0x0d;
    static constexpr std::string_view name = "DW_ATE_signed_fixed";
    static constexpr std::string_view desc = "Signed fixed-point numerical base type encoding";
};
}
