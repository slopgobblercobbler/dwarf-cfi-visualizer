import json
import os
import unittest

class TestDwarfArithmetic(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_expr_arithmetic_ops.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_ops(self):
        self.assertEqual(self.data['DW_OP_abs'], "0x19")
        self.assertEqual(self.data['DW_OP_plus'], "0x22")

if __name__ == '__main__':
    unittest.main()
