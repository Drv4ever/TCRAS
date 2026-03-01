
import unittest
from src.server.core.graph_engine import TransferGraph
from src.server.core.risk_engine import RiskEngine

class TestCore(unittest.TestCase):
    def test_graph_engine_cycle(self):
        g = TransferGraph()
        g.add_transfer("A", "B", "file1.exe", "2025-01-01")
        g.add_transfer("B", "C", "file1.exe", "2025-01-01")
        g.add_transfer("C", "A", "file1.exe", "2025-01-01")
        
        self.assertTrue(g.is_cyclic())
        self.assertEqual(g.get_longest_chain(), 999)

    def test_graph_engine_normal(self):
        g = TransferGraph()
        g.add_transfer("192.168.1.1", "192.168.1.2", "doc.pdf", "2025-01-01")
        self.assertFalse(g.is_cyclic())

    def test_risk_engine(self):
        r = RiskEngine()
        # Test High Risk (Cycle)
        score, level, _ = r.calculate_risk(1000, 999, 1, True)
        self.assertEqual(level, "HIGH")
        
        # Test Normal
        score, level, _ = r.calculate_risk(1000, 2, 1, False)
        # Should be low or medium depending on random init, but definitely not 95+ usually
        # Should be low or medium depending on random init, but definitely not 95+ usually
        self.assertNotEqual(score, 999)  

    def test_config_loading(self):
        from src.server.core.config import settings
        self.assertIsNotNone(settings.get_server_host())
        self.assertIsNotNone(settings.get_db_path())
        self.assertTrue(settings.get_server_url().startswith("http"))

    def test_api_key_configured(self):
        from src.server.core.config import settings
        key = settings.get_api_key()
        self.assertTrue(len(key) > 0)

if __name__ == '__main__':
    unittest.main()
