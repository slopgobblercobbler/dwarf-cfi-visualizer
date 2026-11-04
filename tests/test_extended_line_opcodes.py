import json
import os
import unittest

class TestExtendedLineOpcodes(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_line_number_extended_part2.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_opcodes(self):
        self.assertEqual(self.data['DW_LNE_set_address_from_index'], 0x05)

if __name__ == '__main__':
    unittest.main()
