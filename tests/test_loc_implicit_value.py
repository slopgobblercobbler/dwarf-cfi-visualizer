import json
import os
import unittest

class TestLocImplicitValue(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_implicit_value.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_implicit_values(self):
        self.assertEqual(self.data['DW_OP_implicit_value'], "0x9E")
        self.assertEqual(self.data['DW_OP_stack_value'], "0x9F")

if __name__ == '__main__':
    unittest.main()
