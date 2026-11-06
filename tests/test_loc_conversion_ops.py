import json
import os
import unittest

class TestLocConversionOps(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_conversion_ops.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_conversions(self):
        self.assertEqual(self.data['DW_OP_convert'], "0xA8")
        self.assertEqual(self.data['DW_OP_reinterpret'], "0xA9")

if __name__ == '__main__':
    unittest.main()
