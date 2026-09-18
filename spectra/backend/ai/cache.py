"""
SPECTRA - Deterministic AI Response Caching Layer
Prevents duplicate API calls across identical (model, prompt, image_hash) tuples.
"""
import hashlib
import json
from typing import Optional, Any, Dict

class ResponseCache:
    def __init__(self):
        self._store: Dict[str, Any] = {}

    def _hash_key(self, model: str, prompt: str, image_bytes: Optional[bytes] = None) -> str:
        h = hashlib.sha256()
        h.update(model.encode('utf-8'))
        h.update(prompt.encode('utf-8'))
        if image_bytes:
            h.update(image_bytes)
        return h.hexdigest()

    def get(self, model: str, prompt: str, image_bytes: Optional[bytes] = None) -> Optional[Any]:
        key = self._hash_key(model, prompt, image_bytes)
        return self._store.get(key)

    def set(self, model: str, prompt: str, data: Any, image_bytes: Optional[bytes] = None) -> None:
        key = self._hash_key(model, prompt, image_bytes)
        self._store[key] = data

global_cache = ResponseCache()
