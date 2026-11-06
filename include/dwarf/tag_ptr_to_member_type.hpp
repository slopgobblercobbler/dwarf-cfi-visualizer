#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwTagPtrToMemberTypeDef {
    static constexpr std::uint16_t tag = 0x1f;
    static constexpr std::string_view name = "DW_TAG_ptr_to_member_type";
    static constexpr std::string_view desc = "DWARF pointer-to-member type descriptor";
};
}
