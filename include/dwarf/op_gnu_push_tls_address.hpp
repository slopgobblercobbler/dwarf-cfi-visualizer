#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpGnuPushTlsAddressDef {
    static constexpr std::uint8_t opcode = 0x96;
    static constexpr std::string_view name = "DW_OP_GNU_push_tls_address";
    static constexpr std::string_view desc = "GNU extension for thread-local storage address calculation";
};
}
