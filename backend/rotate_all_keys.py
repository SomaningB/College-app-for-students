import os, re, secrets
from dotenv import load_dotenv

load_dotenv()

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")

print("=" * 60)
print("KEY ROTATION REPORT")
print("=" * 60)
print("")
print("The JWT_SECRET has already been rotated automatically.")
print("The following keys require manual rotation in their dashboards:")
print("")

# 1. OpenAI
openai_key = os.getenv("OPENAI_API_KEY", "")
if openai_key.startswith("sk-"):
    print("--- OPENAI_API_KEY ---")
    print("  URL: https://platform.openai.com/api-keys")
    print("  Action: Create a new key, delete the old one")
    print(f"  Old key prefix: {openai_key[:15]}...")
    print("  Update OPENAI_API_KEY in backend/.env with the new key.")
    print("")

# 2. OpenRouter
or_key = os.getenv("OPENROUTER_API_KEY", "")
if or_key.startswith("sk-or-"):
    print("--- OPENROUTER_API_KEY ---")
    print("  URL: https://openrouter.ai/keys")
    print("  Action: Create a new key, revoke the old one")
    print(f"  Old key prefix: {or_key[:15]}...")
    print("  Update OPENROUTER_API_KEY in backend/.env with the new key.")
    print("")

# 3. Brevo
brevo_key = os.getenv("BREVO_API_KEY", "")
if brevo_key.startswith("xkeysib-"):
    print("--- BREVO_API_KEY ---")
    print("  URL: https://app.brevo.com/settings/keys/api")
    print("  Action: Generate new key, delete the old one")
    print(f"  Old key prefix: {brevo_key[:15]}...")
    print("  Update BREVO_API_KEY in backend/.env with the new key.")
    print("")

# 4. MongoDB
mongodb_url = os.getenv("MONGODB_URL", "")
if mongodb_url and "mongodb+srv://" in mongodb_url:
    from urllib.parse import urlparse
    parsed = urlparse(mongodb_url)
    user = parsed.username or ""
    new_mongo_password = secrets.token_urlsafe(16)

    print("--- MONGODB_URL ---")
    print("  URL: https://cloud.mongodb.com")
    print(f"  Action: Database Access -> Edit user '{user}'")
    print("  Generate a new password and update MONGODB_URL in backend/.env")
    print(f"  Suggested new password: {new_mongo_password}")
    new_url = mongodb_url.replace(f":{parsed.password}@", f":{new_mongo_password}@")
    print(f"  New URL preview: {new_url[:70]}...")
    print("")

print("=" * 60)
print("After updating all keys in backend/.env, restart the server.")
print("=" * 60)

# Clean up temp files
for f in ["rotate_keys.py", "rotate_openai.py"]:
    p = os.path.join(os.path.dirname(__file__), f)
    if os.path.exists(p):
        os.remove(p)
