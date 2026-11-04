import json
import os
import unittest

class TestDwarfEndianness(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_endianness_constants.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_endianness(self):
        self.assertEqual(self.data['DW_END_default'], 0)
        self.assertEqual(self.data['DW_END_little'], 2)

if __name__ == '__main__':
    unittest.main()
