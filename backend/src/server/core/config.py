import yaml
import os
from typing import Dict, Any

class SingletonMeta(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Settings(metaclass=SingletonMeta):
    def __init__(self):
        self._config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        # Assume config.yaml is in the project root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        config_path = os.path.join(base_dir, "config.yaml")
        
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Config file not found at {config_path}")

        with open(config_path, "r") as f:
            return yaml.safe_load(f)

    def get_server_host(self) -> str:
        return self._config.get("server", {}).get("host", "127.0.0.1")

    def get_server_port(self) -> int:
        return self._config.get("server", {}).get("port", 8000)

    def get_server_url(self) -> str:
        host = self.get_server_host()
        port = self.get_server_port()
        # "0.0.0.0" is for binding, but invalid for clients to connect to
        if host == "0.0.0.0":
            host = "127.0.0.1" 
        return f"http://{host}:{port}"

    def get_db_path(self) -> str:
        # Resolve relative path to absolute based on root
        raw_path = self._config.get("server", {}).get("db_path", "./tcras.db")
        if os.path.isabs(raw_path):
            return raw_path
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        return os.path.abspath(os.path.join(base_dir, raw_path))

    def get_api_key(self) -> str:
        return self._config.get("security", {}).get("api_key", "")

    def get_agent_watch_dir(self) -> str:
        # Resolve relative path
        raw_path = self._config.get("agent", {}).get("root_watch_dir", "./monitored_files")
        if os.path.isabs(raw_path):
            return raw_path
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        return os.path.abspath(os.path.join(base_dir, raw_path))

settings = Settings()
