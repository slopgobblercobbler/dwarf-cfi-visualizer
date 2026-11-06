import json
import os
import unittest

class TestDwarfCallRef(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_call2_and_call4.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_call_ops(self):
        self.assertEqual(self.data['DW_OP_call2'], 0x98)
        self.assertEqual(self.data['DW_OP_call_ref'], 0x9A)

if __name__ == '__main__':
    unittest.main()
