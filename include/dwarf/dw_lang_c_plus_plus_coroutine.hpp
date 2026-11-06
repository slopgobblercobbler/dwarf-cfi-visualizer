#pragma once
#include <cstdint>
#include <string_view>

namespace dwarf {
struct DwLangCPlusPlusCoroutineDef {
    static constexpr std::uint32_t lang_code = 0x002f;
    static constexpr std::string_view name = "DW_LANG_C_plus_plus_coroutine";
    static constexpr std::string_view desc = "ISO C++ 2020 coroutine compilation unit identifier";
};
}
