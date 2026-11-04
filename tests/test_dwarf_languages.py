import json
import os
import unittest

class TestDwarfLanguages(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_source_languages.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_languages(self):
        self.assertEqual(self.data['DW_LANG_C'], 0x0002)
        self.assertEqual(self.data['DW_LANG_C_plus_plus'], 0x0004)
        self.assertEqual(self.data['DW_LANG_C_plus_plus_20'], 0x0028)

if __name__ == '__main__':
    unittest.main()
