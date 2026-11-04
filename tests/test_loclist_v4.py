import json
import os
import unittest

class TestLoclistV4(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loclist_v4.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_sentinels(self):
        self.assertEqual(self.data['base_address_selection_entry'], "0xFFFFFFFFFFFFFFFF")

if __name__ == '__main__':
    unittest.main()
