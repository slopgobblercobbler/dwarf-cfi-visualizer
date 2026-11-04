import json
import os
import unittest

class TestCieVersion(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'cie_version.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_versions(self):
        self.assertEqual(self.data['DWARF_CIE_VERSION_1'], 1)
        self.assertEqual(self.data['DWARF_CIE_VERSION_3'], 3)
        self.assertEqual(self.data['DWARF_CIE_VERSION_4'], 4)

if __name__ == '__main__':
    unittest.main()
