#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpPushObjectAddressDef {
    static constexpr std::uint8_t opcode = 0x97;
    static constexpr std::string_view name = "DW_OP_push_object_address";
    static constexpr std::string_view desc = "Pushes base address of object whose member is being evaluated";
};
}
