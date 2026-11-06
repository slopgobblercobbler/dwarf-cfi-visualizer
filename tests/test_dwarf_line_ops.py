import json
import os
import unittest

class TestDwarfLineOps(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_line_extended_opcodes.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_opcodes(self):
        self.assertEqual(self.data['DW_LNE_end_sequence'], "0x01")
        self.assertEqual(self.data['DW_LNE_set_address'], "0x02")

if __name__ == '__main__':
    unittest.main()
