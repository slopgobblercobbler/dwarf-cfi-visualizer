import json
import os
import unittest

class TestDwarfTags(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_tag_constants.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_tags(self):
        self.assertEqual(self.data['DW_TAG_compile_unit'], 0x11)
        self.assertEqual(self.data['DW_TAG_subprogram'], 0x2e)
        self.assertEqual(self.data['DW_TAG_base_type'], 0x24)

if __name__ == '__main__':
    unittest.main()
