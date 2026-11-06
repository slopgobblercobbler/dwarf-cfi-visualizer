import json
import os
import unittest

class TestLocImplicitPointer(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loc_expr_implicit_pointer.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_implicit_pointer(self):
        self.assertEqual(self.data['DW_OP_implicit_pointer'], "0xA0")
        self.assertTrue(self.data['requires_die_ref_uleb128'])

if __name__ == '__main__':
    unittest.main()
