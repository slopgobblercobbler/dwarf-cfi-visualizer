import json
import os
import unittest

class TestLocBraSkip(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_bra_skip_ops.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_branches(self):
        self.assertEqual(self.data['DW_OP_bra'], "0x28")
        self.assertEqual(self.data['DW_OP_skip'], "0x2F")

if __name__ == '__main__':
    unittest.main()
