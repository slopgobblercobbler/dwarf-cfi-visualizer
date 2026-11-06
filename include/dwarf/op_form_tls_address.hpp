#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwOpFormTlsAddressDef {
    static constexpr std::uint8_t opcode = 0x9b;
    static constexpr std::string_view name = "DW_OP_form_tls_address";
    static constexpr std::string_view desc = "Translates thread-local storage offset into physical memory address";
};
}
