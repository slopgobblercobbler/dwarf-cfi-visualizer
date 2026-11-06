import json
import os
import unittest

class TestDwarfEntryValue(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_entry_value_specs.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_entry_value_opcodes(self):
        self.assertEqual(self.data['DW_OP_entry_value'], 0xA3)
        self.assertEqual(self.data['DW_OP_GNU_entry_value'], 0xF3)

if __name__ == '__main__':
    unittest.main()
