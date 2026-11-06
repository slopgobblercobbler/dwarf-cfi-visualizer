import json
import os
import unittest

class TestDwarfCfa(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_call_frame_cfa.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_cfa_op(self):
        self.assertEqual(self.data['DW_OP_call_frame_cfa'], 0x9C)

if __name__ == '__main__':
    unittest.main()
