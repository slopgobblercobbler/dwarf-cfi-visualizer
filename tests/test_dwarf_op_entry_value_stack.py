import json
import os
import unittest

class TestDwarfStackValue(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_entry_value_stack.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_stack_value(self):
        self.assertEqual(self.data['DW_OP_stack_value'], 0x9F)
        self.assertEqual(self.data['DW_OP_implicit_value'], 0x9E)

if __name__ == '__main__':
    unittest.main()
