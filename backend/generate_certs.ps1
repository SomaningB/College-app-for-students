# Generate self-signed certificates for development HTTPS
# Production: use a real CA (Let's Encrypt, etc.)

$CERT_DIR = Join-Path $PSScriptRoot "certs"
New-Item -ItemType Directory -Path $CERT_DIR -Force | Out-Null

$KEY_FILE = Join-Path $CERT_DIR "key.pem"
$CERT_FILE = Join-Path $CERT_DIR "cert.pem"

if ((Test-Path $KEY_FILE) -and (Test-Path $CERT_FILE)) {
    Write-Output "Certificates already exist. Delete them to regenerate."
    exit 0
}

# Try openssl first
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openssl) {
    & openssl req -x509 -newkey rsa:4096 `
        -keyout $KEY_FILE `
        -out $CERT_FILE `
        -days 365 -nodes `
        -subj "/C=IN/ST=Karnataka/L=City/O=CollegeApp/CN=localhost"
} else {
    Write-Output "OpenSSL not found. Install OpenSSL or use WSL."
    Write-Output "Download from: https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
}

Write-Output "Certificates generated:"
Write-Output "  Key: $KEY_FILE"
Write-Output "  Cert: $CERT_FILE"
Write-Output ""
Write-Output "Update the .env file with:"
Write-Output "  USE_HTTPS=true"
Write-Output "  SSL_CERT_PATH=$CERT_FILE"
Write-Output "  SSL_KEY_PATH=$KEY_FILE"
