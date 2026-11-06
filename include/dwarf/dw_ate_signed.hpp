#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteSignedDef {
    static constexpr std::uint8_t encoding = 0x05;
    static constexpr std::string_view name = "DW_ATE_signed";
    static constexpr std::string_view desc = "Signed two's-complement integer numerical base type encoding";
};
}
