import json
import os
import unittest

class TestDwarfObjectAddress(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_push_object_address.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_op(self):
        self.assertEqual(self.data['DW_OP_push_object_address'], 0x97)

if __name__ == '__main__':
    unittest.main()
