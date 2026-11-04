import json
import os
import unittest

class TestDwarfInlines(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_inline_codes.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_inlines(self):
        self.assertEqual(self.data['DW_INL_not_inlined'], 0)
        self.assertEqual(self.data['DW_INL_inlined'], 1)

if __name__ == '__main__':
    unittest.main()
