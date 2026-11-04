import json
import os
import unittest

class TestDwarfExpressions(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_operation_expressions.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_opcodes(self):
        self.assertEqual(self.data['DW_OP_addr'], 0x03)
        self.assertEqual(self.data['DW_OP_deref'], 0x06)
        self.assertEqual(self.data['DW_OP_plus_uconst'], 0x23)

if __name__ == '__main__':
    unittest.main()
