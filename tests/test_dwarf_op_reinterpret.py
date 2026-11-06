import json
import os
import unittest

class TestDwarfReinterpret(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_reinterpret_specs.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_reinterpret_op(self):
        self.assertEqual(self.data['DW_OP_reinterpret'], 0xA9)

if __name__ == '__main__':
    unittest.main()
