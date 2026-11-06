import json
import os
import unittest

class TestLocConstType(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_const_type.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_const_type(self):
        self.assertEqual(self.data['DW_OP_const_type'], "0xA4")
        self.assertTrue(self.data['requires_die_ref_uleb128'])

if __name__ == '__main__':
    unittest.main()
