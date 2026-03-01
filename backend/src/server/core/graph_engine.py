import networkx as nx
import logging

logger = logging.getLogger(__name__)

class TransferGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_transfer(self, source: str, destination: str, filename: str, timestamp):
        """
        Adds a transfer edge to the graph.
        nodes: IP addresses or Users
        edge: file transfer with attributes
        """
        self.graph.add_node(source, type="device")
        self.graph.add_node(destination, type="device")
        
        self.graph.add_edge(
            source, 
            destination, 
            filename=filename, 
            timestamp=timestamp
        )
        logger.info(f"Graph updated: {source} -> {destination} ({filename})")

    def get_longest_chain(self) -> int:
        """
        Returns the length of the longest path in the DAG.
        If cycle detected, returns infinity substitute or handles it.
        """
        try:
            return nx.dag_longest_path_length(self.graph)
        except nx.NetworkXUnfeasible:
            # Cycle detected
            return 999 

    def is_cyclic(self) -> bool:
        try:
            nx.find_cycle(self.graph)
            return True
        except nx.NetworkXNoCycle:
            return False

    def get_node_degree(self, node: str) -> int:
        if node in self.graph:
            return self.graph.degree(node)
        return 0

    def export_graph_data(self):
        """
        Returns nodes and links for frontend visualization (e.g. D3.js or generic JSON)
        """
        return nx.node_link_data(self.graph)

graph_engine = TransferGraph()
