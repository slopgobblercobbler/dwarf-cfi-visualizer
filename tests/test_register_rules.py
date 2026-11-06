import json
import os
import unittest

class TestRegisterRules(unittest.TestCase):
    def setUp(self):
        p = os.path.join(os.path.dirname(__file__), '..', 'src', 'dwarf_expr_register_rules.json')
        with open(p, 'r') as f:
            self.data = json.load(f)

    def test_rules(self):
        self.assertEqual(self.data['Undefined'], 0)
        self.assertEqual(self.data['Offset'], 2)

if __name__ == '__main__':
    unittest.main()
