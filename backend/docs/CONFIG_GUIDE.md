# TCRAS Configuration Guide

This document references the central configuration file `config.yaml` located in the project root.

## Structure

```yaml
server:
  host: "0.0.0.0"       # Listen on all interfaces
  port: 8000            # Web Server Port
  db_path: "./tcras.db" # SQLite Database location

security:
  api_key: "CHANGE_ME_256_BIT" # Secret Key for API Access

agent:
  root_watch_dir: "./monitored_files" # Directory to watch for changes
```

## Environment Overrides
You can modify these values directly in the file. The server, agent, and transfer app must be restarted for changes to take effect.

## Security Best Practices
- Change the `api_key` immediately after setup.
- Ensure `config.yaml` is not readable by unauthorized users.
- For production, consider using environment variables if the code is extended to support them.
