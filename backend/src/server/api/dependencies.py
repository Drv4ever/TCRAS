from fastapi import Header, Query, HTTPException, status
from src.server.core.config import settings
from typing import Optional

async def verify_api_key(
    x_api_key: Optional[str] = Header(None),
    token: Optional[str] = Query(None) # Support for SSE which can't set headers easily
):
    api_key_server = settings.get_api_key()
    
    # Check Header first
    if x_api_key == api_key_server:
        return True
        
    # Check Query Param
    if token == api_key_server:
        return True
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key",
    )
