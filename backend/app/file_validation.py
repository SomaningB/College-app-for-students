MAGIC_BYTES = {
    ".pdf": [(b"%PDF", 0)],
    ".txt": [],
    ".md": [],
    ".doc": [(b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1", 0)],
    ".docx": [(b"PK\x03\x04", 0), (b"PK\x05\x06", 0), (b"PK\x07\x08", 0)],
}

def validate_file_signature(content: bytes, ext: str) -> bool:
    if ext not in MAGIC_BYTES:
        return False
    sigs = MAGIC_BYTES[ext]
    if not sigs:
        return True
    for sig, offset in sigs:
        if content[offset:offset + len(sig)] == sig:
            return True
    return False
