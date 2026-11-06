import json
import os
import unittest

class TestLocStackOps(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_stack_ops.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_stack_ops(self):
        self.assertEqual(self.data['DW_OP_dup'], "0x12")
        self.assertEqual(self.data['DW_OP_drop'], "0x13")

if __name__ == '__main__':
    unittest.main()
