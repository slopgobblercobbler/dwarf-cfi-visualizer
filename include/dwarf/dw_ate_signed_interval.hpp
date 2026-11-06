#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteSignedIntervalDef {
    static constexpr std::uint8_t encoding = 0x0e;
    static constexpr std::string_view name = "DW_ATE_signed_interval";
    static constexpr std::string_view desc = "Signed interval numerical base type encoding";
};
}
