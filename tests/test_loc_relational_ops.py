import json
import os
import unittest

class TestLocRelationalOps(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_relational_ops.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_relational_ops(self):
        self.assertEqual(self.data['DW_OP_eq'], "0x29")
        self.assertEqual(self.data['DW_OP_ne'], "0x2E")

if __name__ == '__main__':
    unittest.main()
