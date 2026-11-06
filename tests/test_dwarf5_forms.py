import json
import os
import unittest

class TestDwarf5Forms(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf5_form_encodings.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_forms(self):
        self.assertEqual(self.data['DW_FORM_strx'], "0x1a")
        self.assertEqual(self.data['DW_FORM_addrx'], "0x1b")

if __name__ == '__main__':
    unittest.main()
