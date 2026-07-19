#!/bin/bash
# Generate self-signed certificates for development HTTPS
# Production: use a real CA (Let's Encrypt, etc.)

CERT_DIR="$(dirname "$0")/certs"
mkdir -p "$CERT_DIR"

if [ -f "$CERT_DIR/key.pem" ] && [ -f "$CERT_DIR/cert.pem" ]; then
    echo "Certificates already exist. Delete them to regenerate."
    exit 0
fi

openssl req -x509 -newkey rsa:4096 \
    -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -days 365 -nodes \
    -subj "/C=IN/ST=Karnataka/L=City/O=CollegeApp/CN=localhost"

echo "Certificates generated:"
echo "  Key: $CERT_DIR/key.pem"
echo "  Cert: $CERT_DIR/cert.pem"
echo ""
echo "To start the backend with HTTPS:"
echo "  uvicorn app.main:app --ssl-keyfile $CERT_DIR/key.pem --ssl-certfile $CERT_DIR/cert.pem"
echo ""
echo "Or add to docker-compose:"
echo "  command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --ssl-keyfile /app/certs/key.pem --ssl-certfile /app/certs/cert.pem"
