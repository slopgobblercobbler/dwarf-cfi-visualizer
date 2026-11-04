import json
import os
import unittest

class TestLineNumberOpcodes(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_line_number_opcodes.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_line_opcodes(self):
        self.assertEqual(self.data['DW_LNS_copy'], 1)
        self.assertEqual(self.data['DW_LNS_advance_pc'], 2)

if __name__ == '__main__':
    unittest.main()
