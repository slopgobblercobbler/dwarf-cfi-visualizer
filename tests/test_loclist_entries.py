import json
import os
import unittest

class TestLoclistEntries(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_loclist_entry_operators.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_operators(self):
        self.assertEqual(self.data['DW_LLE_end_of_list'], 0)
        self.assertEqual(self.data['DW_LLE_offset_pair'], 4)

if __name__ == '__main__':
    unittest.main()
