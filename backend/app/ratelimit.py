import time
from collections import defaultdict
from fastapi import HTTPException, Request
from typing import Callable

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)

    def _cleanup(self, key: str, window: float):
        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < window]

    def check(self, key: str, max_requests: int, window: float = 60.0):
        self._cleanup(key, window)
        if len(self.requests[key]) >= max_requests:
            return False
        self.requests[key].append(time.time())
        return True

    async def __call__(self, request: Request, max_requests: int = 20, window: float = 60.0):
        client_ip = request.client.host if request.client else "unknown"
        key = f"{client_ip}:{request.url.path}"
        if not self.check(key, max_requests, window):
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

rate_limiter = RateLimiter()

def rate_limit(max_requests: int = 20, window: float = 60.0):
    async def dependency(request: Request):
        await rate_limiter(request, max_requests=max_requests, window=window)
    return dependency
