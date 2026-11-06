#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwAteAddressDef {
    static constexpr std::uint8_t encoding = 0x01;
    static constexpr std::string_view name = "DW_ATE_address";
    static constexpr std::string_view desc = "Machine virtual memory address base type encoding";
};
}
