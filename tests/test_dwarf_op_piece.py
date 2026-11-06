import json
import os
import unittest

class TestDwarfOpPiece(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_op_piece_and_bit_piece.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_opcodes(self):
        self.assertEqual(self.data['DW_OP_piece'], 0x93)
        self.assertEqual(self.data['DW_OP_bit_piece'], 0x9D)

if __name__ == '__main__':
    unittest.main()
