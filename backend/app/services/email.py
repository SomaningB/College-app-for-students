import httpx
import logging
from app.config import BREVO_API_KEY, FROM_EMAIL, FROM_NAME

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

async def send_email(to_email: str, to_name: str, subject: str, html_content: str):
    if not BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not set. Skipping email send.")
        return

    payload = {
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "htmlContent": html_content
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                BREVO_API_URL,
                json=payload,
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout=15
            )
            if resp.status_code not in (200, 201):
                logger.error(f"Brevo email failed: {resp.status_code} {resp.text}")
            else:
                logger.info(f"Verification email sent to {to_email}")
            return resp
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise

async def send_verification_email(to_email: str, to_name: str, code: str):
    subject = "Your verification code - College App"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6c63ff, #e040fb); display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 800;">C</div>
            </div>
            <h2 style="text-align: center; margin: 0 0 8px; color: #1a1a2e;">Email Verification</h2>
            <p style="text-align: center; color: #666; margin: 0 0 24px; font-size: 14px;">Hi {to_name}, use the code below to verify your email address.</p>
            <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; padding: 16px 40px; border-radius: 12px; background: linear-gradient(135deg, #6c63ff, #e040fb); color: white; font-size: 36px; font-weight: 800; letter-spacing: 8px;">{code}</div>
            </div>
            <p style="text-align: center; color: #999; margin: 24px 0 0; font-size: 12px;">This code expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
        </div>
    </body>
    </html>
    """
    await send_email(to_email, to_name, subject, html)
