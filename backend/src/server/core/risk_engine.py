import numpy as np
from sklearn.ensemble import IsolationForest
import logging
import random

logger = logging.getLogger(__name__)

class RiskEngine:
    def __init__(self):
        self.model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        self.is_fitted = False
        self._initialize_dummy_model()

    def _initialize_dummy_model(self):
        """
        Initialize with some synthetic normal data so the model is ready to predict.
        Features: [file_size, chain_length, node_degree]
        """
        # Generate 100 'normal' events
        X_train = []
        for _ in range(100):
            # Normal: size ~ 1MB-100MB, chain 1-3, degree 1-5
            size = random.uniform(1000, 100_000_000)
            chain = random.randint(1, 3)
            degree = random.randint(1, 5)
            X_train.append([size, chain, degree])
        
        self.model.fit(np.array(X_train))
        self.is_fitted = True
        logger.info("Risk Engine initialized with dummy data.")

    def calculate_risk(self, file_size: int, chain_length: int, node_degree: int, is_cycle: bool) -> tuple[float, str, str]:
        """
        Returns (risk_score_0_100, risk_level, details)
        """
        # Heuristic Override
        if is_cycle:
            return 95.0, "HIGH", "Cyclic transfer detected (Worm behavior)"
        
        if chain_length > 5:
            return 85.0, "HIGH", "Abnormal chain length > 5"

        # ML Anomaly Detection
        features = np.array([[file_size, chain_length, node_degree]])
        # Anomaly score: lower is more anomalous. Sklearn gives [-1, 1].
        # We want to map to 0-100 where 100 is high risk.
        # decision_function returns average anomaly score. 
        # Negative scores represent outliers.
        score_raw = self.model.decision_function(features)[0]
        
        # Normalize roughly:
        # score_raw approx range: -0.2 (very anomaly) to 0.2 (very normal)
        # We map -0.2 -> 100, 0.2 -> 0
        
        # Smoother inversion to avoid collapsing too often to 0 in pre-check mode
        risk_score = 50 - (score_raw * 120)

        # Size-based adjustment layered on top of the Isolation Forest score.
        # This does not replace the model; it pushes very small files down and
        # large files up so the final score better matches the demo policy.
        size_boost = 0.0
        if file_size >= 500 * 1024 * 1024:      # >= 500 MB
            size_boost = 32.0
        elif file_size >= 300 * 1024 * 1024:    # >= 300 MB
            size_boost = 26.0
        elif file_size >= 200 * 1024 * 1024:    # >= 200 MB
            size_boost = 21.0
        elif file_size >= 100 * 1024 * 1024:    # >= 100 MB
            size_boost = 14.0
        elif file_size >= 50 * 1024 * 1024:     # >= 50 MB
            size_boost = 8.0
        elif file_size <= 1 * 1024 * 1024:      # <= 1 MB
            size_boost = -12.0
        elif file_size <= 5 * 1024 * 1024:      # <= 5 MB
            size_boost = -8.0
        elif file_size <= 10 * 1024 * 1024:     # <= 10 MB
            size_boost = -5.0

        risk_score += size_boost
        risk_score = max(0, min(100, risk_score)) # Clamp
        
        level = "LOW"
        if risk_score > 70:
            level = "HIGH"
        elif risk_score > 40:
            level = "MEDIUM"

        return round(risk_score, 2), level, f"ML Score: {score_raw:.2f}, Size Boost: +{size_boost:.0f}"

risk_engine = RiskEngine()
